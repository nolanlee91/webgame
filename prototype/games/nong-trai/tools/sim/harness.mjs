// Harness tối thiểu cho bộ mô phỏng cân bằng: ghép các module luật THẬT (core/*, data/*) trên một trạng thái nông trại,
// thay cho apply() của M1 (apply.js / state.js đang được sửa song song nên KHÔNG import ở đây).
// Mỗi hàm hành động gọi thẳng hàm luật thuần, gom sự kiện, rồi đếm nhiệm vụ (M1 quests.track + M4 village.track) — giống
// thứ tự apply() sẽ làm khi ghép. Hàm luật trả { err } thì không đổi gì ⇒ harness không cần structuredClone.
//
// Khác biệt có chủ ý so với bản đang chạy trong trình duyệt (ghi trong README):
//  - Mọi máy / công trình M2–M4 đều dùng được (không lọc CURRENT_MILESTONE), công trình theo core/build.js (M3).
//  - Nhà kính: 6 ô thêm vào cuối s.plots (chỉ trồng Mía / cây thường), coi như luôn được tưới. Khu đất Đông: +9 ô.
import { CROP, CROPS } from "../../data/crops.js?v=m6";
import { ITEM } from "../../data/catalog.js?v=m6";
import { FIRST_ORDERS, ORDER_TYPES } from "../../data/orders.js?v=m6";
import { WAREHOUSE, OVERFLOW_MAX } from "../../data/warehouse.js?v=m6";
import { QUESTS } from "../../data/quests.js?v=m6";
import { RECIPE } from "../../data/recipes.js?v=m6";
import { MACHINE } from "../../data/machines.js?v=m6";
import { ANIMAL } from "../../data/animals.js?v=m6";
import { BUILDING } from "../../data/buildings.js?v=m6";
import * as plots from "../../core/plots.js?v=m6";
import * as orders from "../../core/orders.js?v=m6";
import * as eco from "../../core/economy.js?v=m6";
import * as quests from "../../core/quests.js?v=m6";
import * as P from "../../core/production.js?v=m6";
import * as A from "../../core/animals.js?v=m6";
import * as V from "../../core/village.js?v=m6";
import * as B from "../../core/build.js?v=m6";
import { MARKET } from "../../core/market.js?v=m6";
import { addXp, xpNeed } from "../../core/progression.js?v=m6";
import { bag, have, settleOverflow, used, capacity, overflowCount } from "../../core/inventory.js?v=m6";
import * as fair from "../../core/fair.js?v=m6";
import * as book from "../../core/collection.js?v=m6";

export const START_COINS = 24; // = core/state.js START_COINS (không import state.js)
export const GREENHOUSE_BASE = plots.W * plots.H; // ô nhà kính bắt đầu từ chỉ số 25

/** Nhóm nguồn thu theo món bán. */
export function sourceOf(id) {
  const cat = ITEM[id]?.cat;
  return cat === "nong-san" ? "raw" : cat === "chan-nuoi" ? "animals" : cat === "thanh-pham" ? "products" : "other";
}

function makeOrder(s, { type, npc, items, mult, materials = {} }, now) {
  const order = { id: s.orders.nextId++, type, npc, items: { ...items }, mult, coins: 0, xp: 0, materials: { ...materials }, createdAt: now,
    expiresAt: ORDER_TYPES[type].durationMs ? now + ORDER_TYPES[type].durationMs : null };
  const { coins, xp } = orders.priceOrder(order);
  order.coins = coins; order.xp = xp;
  return order;
}

/** Trạng thái mới — cùng hình dạng createState() của core/state.js (v4) + field M3/M4 (build, animals, village). */
export function createFarm(now, seed) {
  const s = {
    coins: START_COINS, xp: 0, level: 1, bought: 0, lastSeen: now, seed: seed >>> 0,
    freeSeeds: 3, giftAt: 0, upgrade: 0, warehouse: 0,
    buildings: {}, decor: {}, decorPlaced: [],
    inv: {}, overflow: {},
    production: P.createProduction(),
    animals: A.createAnimals(),
    village: V.createVillage(),
    orders: { nextId: 1, slots: [], special: null, special2: null },
    quests: { tut: 0, progress: 0 },
    plots: Array.from({ length: plots.W * plots.H }, (_, i) => plots.emptyPlot(plots.START_OPEN.has(i))),
    stats: { harvested: 0, earned: 0, delivered: 0 },
    collection: book.createCollection(), fair: fair.createFair(), // Milestone 6
  };
  s.orders.slots = FIRST_ORDERS.map((o) => ({ rev: 0, order: makeOrder(s, o, now), refillAt: now }));
  return s;
}

/** Tổng XP tích luỹ từ cấp 1. */
export const totalXp = (s) => { let t = s.xp; for (let l = 1; l < s.level; l++) t += xpNeed(l); return t; };

/**
 * Bao trạng thái + sổ sách. Mọi hành động đi qua đây.
 * meta: income/spend theo nguồn, đếm hành động, sự kiện đáng chú ý (lần đầu ...).
 */
export class Farm {
  /** opts.xpNeed: đường cong XP thử nghiệm (lv → XP cần), null ⇒ dùng đúng core/progression.js. */
  constructor(now, seed, opts = {}) {
    this.xpCurve = opts.xpNeed || null;
    this.trueXp = 0; // tổng XP (đơn vị gốc) khi dùng đường cong thử nghiệm
    this.s = createFarm(now, seed);
    this.now = now;
    this.income = { raw: 0, orders: 0, products: 0, animals: 0, quests: 0, other: 0 };
    this.spend = { seeds: 0, plots: 0, buildings: 0, machines: 0, machineUpgrades: 0, animals: 0, materials: 0, feed: 0 };
    this.counts = {};
    this.xpBy = {};     // XP theo loại hành động
    this.firsts = {};   // tên sự kiện → now lần đầu
    this.eventLog = []; // (giới hạn) sự kiện hiếm cho báo cáo
    this.errors = [];   // vi phạm bất biến
    this.useful = 0;    // số hành động có ích trong tick hiện tại
    this.prevLevel = 1;
    this.levelAt = { 1: now };
    this.ghCount = 0; this.eastCount = 0;
    this.taps = Infinity; // số thao tác (chạm) còn được dùng trong lần nhìn này — bộ mô phỏng đặt theo hồ sơ
    this.tapsUsed = 0;
    this.clock = 0;     // ms chơi tích luỹ (bộ mô phỏng cập nhật)
  }
  // ---- giao diện tiêm cho M2/M3/M4 ----
  inv() { return bag(this.s); }
  wallet(src = "other") {
    const s = this.s, self = this;
    return {
      coins: () => s.coins,
      spend: (n) => (Number.isSafeInteger(n) && n >= 0 && s.coins >= n ? ((s.coins -= n), true) : false),
      earn: (n) => { s.coins += n; s.stats.earned += n; self.income[src] = (self.income[src] || 0) + n; },
    };
  }
  eff(now = this.now) { return B.effects(this.s, now); }
  builtIds(now = this.now) { return B.builtIds(this.s, now, this.s.level); }
  prodCtx(now = this.now) { return { level: this.s.level, buildings: this.builtIds(now), extraSlots: this.eff(now).extraQueueSlots }; }
  animalCtx(now = this.now) {
    const e = this.eff(now);
    return { level: this.s.level, capacity: (k) => (k === "ga" ? e.chickenCap : k === "bo-sua" ? e.cowCap : 0) };
  }
  villageCtx(now = this.now) {
    const s = this.s;
    return { level: s.level, seed: s.seed, buildings: s.buildings, hasBuilding: (id) => B.isBuilt(s, id, now), tutorialDone: V.tutorialDone(s) }; // như core/apply.js rulesCtx
  }
  io() {
    const s = this.s;
    return { inv: this.inv(), wallet: this.wallet("quests"), decor: { add: (id, n) => { s.decor[id] = (s.decor[id] || 0) + n; } } };
  }

  /** Chạy một hành động: fn(events) trả kết quả luật. Thành công ⇒ đếm nhiệm vụ, kiểm bất biến. */
  run(name, fn, { useful = true } = {}) {
    if (this.taps <= 0) return { err: "taps" };
    const before = { coins: this.s.coins, xp: totalXp(this.s) };
    const snap = { inv: { ...this.s.inv }, overflow: { ...this.s.overflow }, decor: { ...this.s.decor } }; // Sổ sưu tập: so kho trước / sau
    const events = [];
    const r = fn(events);
    if (!r || r.err) return r || { err: "bad" };
    book.track(this.s, snap, name === "buy" ? "marketBuy" : name, events);
    if (this.xpCurve) this.relevel(totalXp(this.s) - before.xp);
    this.post(events);
    this.counts[name] = (this.counts[name] || 0) + 1;
    this.taps--; this.tapsUsed++;
    this.xpBy[name] = (this.xpBy[name] || 0) + totalXp(this.s) - before.xp;
    if (useful) this.useful++;
    this.check(name, before);
    return r;
  }
  /** Sau mỗi hành động (cả sync): nhiệm vụ M1 + M4, sự kiện lần đầu, lên cấp. */
  post(events) {
    const s = this.s;
    quests.track(s, events);
    const extra = V.track(s.village, events, this.villageCtx());
    events.push(...extra);
    for (const e of events) {
      this.first(e.type);
      if (e.type === "orderNew" && e.orderType) this.first("order:" + e.orderType);
      if (e.type === "levelUp") this.levelAt[e.level] = this.now;
      if (e.type === "gift") this.eventLog.push({ t: this.now, type: "gift" });
      if (e.type === "bookTierReady") { this.bookAt ||= {}; this.bookAt[e.at] = +(this.clock / 3600_000).toFixed(1); } // giờ chơi tới mốc sổ
    }
  }
  xpTotal() { return this.xpCurve ? this.trueXp : totalXp(this.s); }
  /** Đường cong thử nghiệm: cộng XP vừa nhận (theo đơn vị gốc) rồi tính lại cấp theo xpCurve. Cấp không bao giờ giảm. */
  relevel(delta) {
    this.trueXp += delta;
    let lv = 1, rest = this.trueXp;
    while (rest >= this.xpCurve(lv)) { rest -= this.xpCurve(lv); lv++; }
    this.s.level = Math.max(lv, this.s.level); this.s.xp = lv >= this.s.level ? rest : 0;
  }
  first(key) { if (!this.firsts[key]) this.firsts[key] = { t: this.now, a: this.clock }; }
  check(name, before) {
    const s = this.s;
    const bad = [];
    if (!Number.isSafeInteger(s.coins) || s.coins < 0) bad.push("coins<0");
    for (const [k, bagX] of [["inv", s.inv], ["overflow", s.overflow], ["decor", s.decor]]) {
      for (const [id, q] of Object.entries(bagX)) if (!Number.isInteger(q) || q < 0) bad.push(`${k}.${id}=${q}`);
    }
    if (overflowCount(s) > OVERFLOW_MAX) bad.push("overflow>max");
    if (s.level < this.prevLevel) bad.push("level-decreased");
    this.prevLevel = s.level;
    if (bad.length && this.errors.length < 50) this.errors.push({ t: this.now, action: name, bad });
  }

  // ---- đồng bộ theo thời gian (như sync() của apply) ----
  sync(now) {
    this.now = now;
    const s = this.s, events = [];
    for (const f of B.tick(s, now)) {
      events.push({ type: "buildingDone", id: f.id, level: f.level });
      this.first("built:" + f.id + "@" + f.level);
    }
    const e = B.effects(s, now);
    s.warehouse = Math.min(e.warehouseTier, WAREHOUSE.length - 1);
    // ô nhà kính / đất phía Đông
    const ghWant = e.greenhousePlots || 0, eastWant = e.eastPlots || 0;
    while (this.ghCount < ghWant) {
      s.plots.splice(GREENHOUSE_BASE + this.ghCount, 0, { ...plots.emptyPlot(true), gh: true });
      this.ghCount++;
    }
    while (this.eastCount < eastWant) { s.plots.push({ ...plots.emptyPlot(true), east: true }); this.eastCount++; }
    orders.sync(s, now, events);
    settleOverflow(s);
    eco.safetyNet(s, now, events);
    events.push(...V.syncVillage(s.village, this.villageCtx(now)));
    this.post(events);
    this.check("sync", {});
    s.lastSeen = now;
  }

  // ---- hành động ----
  plant(i, crop) {
    const s = this.s;
    return this.run("plant", (ev) => {
      const r = plots.plant(s, i, crop, this.now, ev);
      if (r.ok) {
        this.spend.seeds += r.cost;
        if (s.plots[i].gh) plots.water(s, i, this.now, []); // nhà kính: không cần tưới (coi như luôn tưới)
      }
      return r;
    });
  }
  water(i) { return this.run("water", (ev) => plots.water(this.s, i, this.now, ev), { useful: false }); }
  harvest(i) { return this.run("harvest", (ev) => plots.harvest(this.s, i, this.now, ev)); }
  /** Nút "Thu hết" (1 chạm). */
  harvestAll() { return this.run("harvestAll", (ev) => plots.harvestAll(this.s, this.now, ev)); }
  buyPlot(i) {
    return this.run("buyPlot", (ev) => { const r = plots.buyPlot(this.s, i, ev); if (r.ok) this.spend.plots += r.cost; return r; });
  }
  sell(id, n) {
    const src = sourceOf(id);
    return this.run("sell", (ev) => {
      // Milestone 6: tiền theo core/fair.js (giá chợ, hoặc giá Phiên chợ khi đang có phiên) — như workshop.marketSell
      if (!MARKET.sellable(id) || !Number.isInteger(n) || n <= 0 || n > 999 || this.have(id) < n) return { err: "empty-stock" };
      const q = fair.quote(this.s, id, n, this.now);
      if (!this.inv().take(id, n)) return { err: "empty-stock" };
      fair.commitSale(this.s, id, q);
      this.wallet(src).earn(q.coins);
      if (q.fair) this.fairBonus = (this.fairBonus || 0) + q.coins - MARKET.priceOf(id, this.now) * n;
      ev.push({ type: "sold", count: n, coins: q.coins, items: { [id]: n }, price: q.price, market: true,
        productUp: !q.fair && MARKET.trend(id, this.now) === "↑" && ITEM[id]?.cat === "thanh-pham" });
      return { ok: true, count: n, coins: q.coins, price: q.price };
    });
  }
  buy(id, n) {
    return this.run("buy", (ev) => {
      const r = MARKET.buy(this.inv(), this.wallet(), id, n, this.now, { level: this.s.level });
      if (r.ok) { this.spend[ITEM[id]?.cat === "vat-lieu" ? "materials" : "feed"] += r.coins; ev.push({ type: "bought", id, count: r.count, coins: r.coins }); }
      return r;
    });
  }
  deliver(slot, order, rev) {
    const s = this.s;
    return this.run("deliver", (ev) => {
      const before = s.coins;
      const r = orders.deliver(s, slot, order.id, rev, this.now, ev);
      if (r.ok) {
        this.income.orders += s.coins - before;
        // core/orders.js deliver() chưa phát `items` (README-M4 câu hỏi mở 1) ⇒ harness KHÔNG tự thêm, để thấy hệ quả thật.
        this.first("deliver:" + order.type);
        this.counts["deliver:" + order.type] = (this.counts["deliver:" + order.type] || 0) + 1;
      }
      return r;
    });
  }
  cancel(slot, order, rev) { return this.run("cancel", (ev) => orders.cancel(this.s, slot, order.id, rev, this.now, ev), { useful: false }); }
  claimQuest(id) {
    const s = this.s;
    return this.run("claimQuest", (ev) => {
      const before = s.coins;
      const r = quests.claim(s, id, ev);
      if (r.ok) this.income.quests += s.coins - before;
      return r;
    });
  }
  villageClaim(kind, ...args) {
    const s = this.s;
    return this.run("villageClaim", (ev) => {
      const fn = kind === "prog" ? V.claimProgression : kind === "chain" ? V.claimChainStep : V.claimBoard;
      const r = fn(s.village, ...args, this.io(), this.villageCtx());
      if (r.ok) { ev.push(...r.events); if (r.xp) addXp(s, r.xp, ev); }
      return r;
    });
  }
  // công trình (core/build.js). Xưởng tặng kèm Bếp sên như core/workshop.js.
  build(id) {
    const s = this.s;
    return this.run("build", (ev) => {
      const r = B.startBuild(s, this.wallet(), this.inv(), id, this.now, { level: s.level });
      if (r.ok) {
        this.spend.buildings += r.cost;
        if (id === "xuong") for (const m of Object.values(MACHINE)) if (m.withWorkshop) P.grantMachine(s.production, m.id, r.readyAt);
        ev.push({ type: "buildStarted", id, cost: r.cost });
        if (r.instant) this.first("built:" + id + "@1");
        this.first("startBuild:" + id);
      }
      return r;
    });
  }
  upgradeBuilding(id) {
    const s = this.s;
    return this.run("upgradeBuilding", (ev) => {
      const r = B.startUpgrade(s, this.wallet(), this.inv(), id, this.now, { level: s.level });
      if (r.ok) {
        this.spend.buildings += r.cost;
        ev.push({ type: "buildingUpgradeStarted", id, level: r.level, cost: r.cost });
        if (r.instant) this.first("built:" + id + "@" + r.level);
        if (id === "nha-kho") ev.push({ type: "warehouseUpgraded", level: r.level }); // nhiệm vụ hướng dẫn "nang-kho" (M1)
      }
      return r;
    });
  }
  buildMachine(id) {
    return this.run("buildMachine", (ev) => {
      const r = P.buildMachine(this.s.production, this.wallet(), id, this.now, this.prodCtx());
      if (r.ok) { this.spend.machines += r.cost; ev.push({ type: "machineBuildStarted", machine: id }); this.first("machine:" + id); }
      return r;
    });
  }
  upgradeMachine(id) {
    return this.run("upgradeMachine", (ev) => {
      const r = P.upgradeMachine(this.s.production, this.wallet(), id, this.now, this.prodCtx());
      if (r.ok) { this.spend.machineUpgrades += r.cost; ev.push({ type: "machineUpgraded", machine: id, level: r.level }); }
      return r;
    });
  }
  enqueue(machine, recipe) {
    return this.run("enqueue", (ev) => {
      const r = P.enqueue(this.s.production, this.inv(), machine, recipe, this.now, this.prodCtx());
      if (r.ok) ev.push({ type: "jobQueued", machine, recipe, uid: r.job.uid });
      return r;
    });
  }
  collectMachines() {
    const s = this.s;
    return this.run("collect", (ev) => {
      const r = P.collectAll(s.production, this.inv(), this.now);
      if (r.ok) {
        for (const c of r.collected) ev.push({ type: "jobCollected", machine: c.machine, uid: c.uid, item: c.item, recipe: c.item, qty: c.qty, overflow: c.overflow });
        addXp(s, r.xp, ev);
      }
      return r;
    });
  }
  buyAnimal(kind) {
    return this.run("buyAnimal", (ev) => {
      const r = A.buyAnimal(this.s.animals, this.wallet(), kind, this.now, this.animalCtx());
      if (r.ok) { this.spend.animals += r.cost; ev.push(...r.events); }
      return r;
    });
  }
  feedAll() {
    return this.run("feed", (ev) => { const r = A.feedAll(this.s.animals, this.inv(), this.now); if (r.ok) ev.push(...r.events); return r; });
  }
  collectAnimals() {
    const s = this.s;
    return this.run("collectAnimals", (ev) => {
      const r = A.collectAll(s.animals, this.inv(), this.now);
      if (r.ok) { ev.push(...r.events); addXp(s, r.xp, ev); }
      return r;
    });
  }
  /** Milestone 6: nhận thưởng mốc Sổ sưu tập. */
  claimBook(tier) {
    const s = this.s;
    return this.run("claimBook", (ev) => {
      const before = s.coins;
      const r = book.claim(s, tier, ev);
      if (r.ok) this.income.quests += s.coins - before;
      return r;
    });
  }
  // ---- đọc ----
  have(id) { return have(this.s, id); }
  used() { return used(this.s); }
  cap() { return capacity(this.s); }
}

export { CROP, CROPS, ITEM, RECIPE, MACHINE, ANIMAL, BUILDING, QUESTS, MARKET, plots, orders, eco, quests, P, A, V, B, xpNeed };
