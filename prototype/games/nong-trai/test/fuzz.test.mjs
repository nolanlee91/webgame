// Fuzz: vài nghìn action ngẫu nhiên (hợp lệ lẫn rác) qua apply(), sau mỗi bước kiểm bất biến.
import test from "node:test";
import assert from "node:assert/strict";
import { apply, invariantError } from "../core/apply.js?v=m17";
import { createState, loadV3, dump } from "../core/state.js?v=m17";
import { used, capacity, overflowCount } from "../core/inventory.js?v=m17";
import { OVERFLOW_MAX } from "../data/warehouse.js?v=m17";
import { TUTORIAL } from "../data/quests.js?v=m17";
import { CROPS } from "../data/crops.js?v=m17";
import { ITEMS } from "../data/catalog.js?v=m17";
import { MACHINES } from "../data/machines.js?v=m17";
import { RECIPES } from "../data/recipes.js?v=m17";
import { QUESTS } from "../data/quests.js?v=m17";
import { capacity as queueCap } from "../core/production.js?v=m17";
import { BUILDINGS, DECOR, DECOR_SLOTS } from "../data/buildings.js?v=m17";
import { effects } from "../core/build.js?v=m17";
import { WAREHOUSE } from "../data/warehouse.js?v=m17";
import { extraSlots } from "../core/workshop.js?v=m17";
import { m4InvariantError } from "../core/m4-handlers.js?v=m17";

function prng(seed) { return () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296); }

function randomAction(r, s) {
  const pick = (xs) => xs[Math.floor(r() * xs.length)];
  const i = r() < 0.05 ? pick([-1, 43, "3", 2.5, null]) : r() < 0.8 ? Math.floor(r() * 25) : Math.floor(r() * 43);
  const bid = r() < 0.05 ? pick(["__proto__", "nha", "coi-xay-gio", "bien-lang", 7]) : pick(BUILDINGS).id;
  const slotObj = () => { const all = [...s.orders.slots.map((x, k) => [k, x]), ...(s.orders.special ? [["special", s.orders.special]] : [])]; return all.length ? pick(all) : [0, { rev: 0 }]; };
  const mid = r() < 0.05 ? pick(["__proto__", "x", undefined]) : r() < 0.6 ? pick(["bep-sen", "coi-xay"]) : pick(MACHINES).id;
  const q = s.production.machines[mid]?.queue || [];
  switch (Math.floor(r() * 28)) {
    case 24: return { type: "startBuild", id: bid };
    case 25: return { type: "startUpgrade", id: bid };
    case 26: return { type: "placeDecor", id: r() < 0.05 ? "x" : pick(DECOR).id, slot: r() < 0.05 ? "__proto__" : pick(DECOR_SLOTS).id };
    case 27: return { type: "removeDecor", slot: r() < 0.5 && s.decorPlaced?.length ? pick(s.decorPlaced).slot : pick(DECOR_SLOTS).id };
    case 14: return { type: pick(["buildWorkshop", "upgradeWorkshop"]) };
    case 15: return { type: "buildMachine", machine: mid };
    case 16: return { type: "upgradeMachine", machine: mid };
    case 17: case 18: return { type: "enqueue", machine: mid, recipe: r() < 0.05 ? "nope" : r() < 0.3 ? pick(RECIPES).id : (RECIPES.filter((x) => x.machine === mid)[0] ? pick(RECIPES.filter((x) => x.machine === mid)).id : "nope") };
    case 19: return { type: "collect", machine: mid, uid: q.length && r() < 0.9 ? pick(q).uid : pick([1, "1", -1, 99]) };
    case 20: return { type: "collectAll", machine: r() < 0.5 ? undefined : mid };
    case 21: return { type: "marketSell", id: pick(ITEMS).id, n: pick([1, 2, 3, 0, -1, 1.5, 1e6]) };
    case 22: return { type: "marketBuy", id: r() < 0.1 ? "hat-ca-rot" : pick(ITEMS).id, n: pick([1, 2, 0, 2.5, 1e6]) };
    case 0: case 1: return { type: "plant", i, crop: r() < 0.05 ? pick(["__proto__", "x", "mia"]) : pick(CROPS).id };
    case 2: return { type: "water", i };
    case 3: case 4: return { type: "harvest", i };
    case 5: return { type: "harvestAll" };
    case 6: return { type: "buyPlot", i };
    case 7: return { type: "sell", id: pick(ITEMS).id, n: r() < 0.3 ? undefined : pick([1, 2, 5, -1, 0, 1.5, 99]) };
    case 8: return { type: pick(["sellAll", "sellOverflow"]) };
    case 9: case 10: { const [slot, x] = slotObj(); return { type: "deliver", slot, id: x.order?.id ?? 1, rev: r() < 0.1 ? x.rev - 1 : x.rev }; }
    case 11: { const [slot, x] = slotObj(); return { type: "cancelOrder", slot, id: x.order?.id ?? 1, rev: x.rev }; }
    case 12: return pick([{ type: "upgradeWarehouse" }, { type: "startUpgrade", id: "nha-kho" }, { type: "upgradeFarm" }, { type: "tick" }, { type: "nope" }]);
    default: return { type: "claimQuest", id: pick(QUESTS).id };
  }
}

function checkAll(s, before) {
  assert.equal(invariantError(s, before), null);
  assert.ok(Number.isSafeInteger(s.coins) && s.coins >= 0, "xu ≥ 0");
  for (const bag of [s.inv, s.overflow, s.decor]) for (const q of Object.values(bag)) assert.ok(Number.isInteger(q) && q >= 0, "số món nguyên ≥ 0");
  assert.ok(overflowCount(s) <= OVERFLOW_MAX);
  assert.ok(used(s) <= Math.max(capacity(s), used(before)), "kho ≤ sức chứa (+ giỏ tràn riêng)");
  assert.ok(s.quests.tut >= before.quests.tut, "nhiệm vụ không lùi");
  for (const [id, m] of Object.entries(s.production.machines)) {
    assert.ok(m.queue.length <= Math.max(queueCap(m, { extraSlots: extraSlots(s) }), before.production.machines[id]?.queue.length ?? 0), "hàng chờ ≤ sức chứa " + id);
    for (let i = 1; i < m.queue.length; i++) assert.ok(m.queue[i].startAt >= m.queue[i - 1].endAt, "chạy tuần tự");
    assert.equal(new Set(m.queue.map((j) => j.uid)).size, m.queue.length, "uid ô không trùng");
  }
  assert.ok(!s.buildings.xuong || s.level >= 4);
  // Milestone 3: công trình, trang trí, ô vùng mới, sức chứa từ công trình
  assert.equal(s.plots.length, 43);
  assert.equal(capacity(s), WAREHOUSE[effects(s, Infinity).warehouseTier].cap, "sức chứa = mốc Nhà kho");
  assert.equal(m4InvariantError(s), null, "đàn vật nuôi hợp lệ (Milestone 4)");
  const slots = s.decorPlaced.map((d) => d.slot);
  assert.equal(new Set(slots).size, slots.length, "mỗi ô trang trí 1 món");
  for (const q of Object.values(s.decor)) assert.ok(Number.isInteger(q) && q > 0);
  const decorTotal = (x) => Object.values(x.decor).reduce((a, b) => a + b, 0) + x.decorPlaced.length;
  assert.ok(decorTotal(s) >= decorTotal(before), "đặt / cất không làm mất đồ trang trí");
  s.plots.forEach((p, k) => {
    if (k >= 25) assert.ok(k < 34 ? p.east : p.gh, "cờ vùng giữ nguyên");
    if (p.crop === "mia" && before.plots[k].crop !== "mia") assert.ok(p.gh, "mía chỉ gieo ở ô Nhà kính");
  });
  const ids = [...s.orders.slots.map((x) => x.order?.id), s.orders.special?.order?.id].filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, "không trùng id đơn");
}

test("fuzz 10 000 action ngẫu nhiên × 5 hạt giống (ruộng, đơn, Xưởng, chợ): bất biến luôn đúng, không giao / nhận trùng", () => {
  let total = 0, collectedOk = 0, enqOk = 0, marketOk = 0;
  for (const seed of [1, 2, 3, 4, 5]) {
    const r = prng(seed);
    let t = 1_000_000;
    const s = createState(t, seed);
    s.coins = seed === 3 ? 0 : 200; // một lượt bắt đầu cháy túi để thử lưới an toàn
    if (seed === 2) s.level = 11;
    if (seed === 1) s.inv["ngo"] = 58; // gần đầy kho ⇒ thử giỏ tràn
    if (seed >= 4) { s.level = seed === 4 ? 5 : 13; s.coins = 50_000; s.inv = { "ca-rot": 30, "ca-chua": 20, "dau-tay": 20, ngo: 8 }; } // có Xưởng, máy, chợ
    const claimed = new Set(), delivered = new Set(), jobs = new Set();
    for (let k = 0; k < 2000; k++) {
      t += Math.floor(r() * 20_000);
      if (seed >= 4 && k % 40 === 0) { // tiếp nguyên liệu như người chơi thu hoạch (ngoài apply, trước ảnh chụp "before")
        if (k === 0) { apply(s, { type: "buildWorkshop" }, t); apply(s, { type: "startBuild", id: "nha-kho" }, t); apply(s, { type: "startUpgrade", id: "nha-kho" }, t); }
        for (const id of ["ca-rot", "ca-chua", "dau-tay", "ngo", "lua"]) s.inv[id] = Math.min(12, (s.inv[id] || 0) + 4);
      }
      const a = randomAction(r, s);
      const before = structuredClone(s);
      const res = apply(s, a, t);
      total++;
      if (res.err) assert.deepEqual(s, before, `lỗi ${res.err} không được đổi trạng thái (${a.type})`);
      for (const e of res.events || []) {
        if (e.type === "questClaimed") { assert.ok(!claimed.has(e.id), "nhận thưởng 2 lần"); claimed.add(e.id); }
        if (e.type === "delivered") { assert.ok(!delivered.has(e.id), "giao trùng đơn"); delivered.add(e.id); }
        if (e.type === "jobCollected") { const k = e.machine + "#" + e.uid; assert.ok(!jobs.has(k), "nhận 2 lần " + k); jobs.add(k); collectedOk++; }
        if (e.type === "jobQueued") enqOk++;
        if ((e.type === "sold" && e.market) || e.type === "bought") marketOk++;
      }
      checkAll(s, before);
      if (k % 250 === 0) { // lưu / tải giữa chừng không làm hỏng gì
        const back = loadV3(dump(s, t), t);
        assert.equal(back.coins, s.coins);
        assert.deepEqual(back.inv, s.inv);
        assert.deepEqual(back.decor, s.decor);
        assert.deepEqual(back.production, s.production);
        assert.deepEqual(back.buildings, s.buildings);
        assert.deepEqual(back.decorPlaced, s.decorPlaced);
        assert.deepEqual(back.plots, s.plots);
        Object.assign(s, back);
      }
    }
  }
  assert.equal(total, 10_000);
  assert.ok(enqOk > 20 && collectedOk > 10 && marketOk > 10, // M3: thêm 4 loại action ⇒ tỉ lệ thao tác chợ thấp hơn
    `quá ít thao tác Xưởng / chợ: ${enqOk} ${collectedOk} ${marketOk}`);
});

test("fuzz Milestone 3: 6 000 action (xây, nâng, trang trí, Nhà kính, đất phía Đông) ở cấp 10 / 17 / 20 — bất biến, không mất xu / đồ", () => {
  let built = 0, upgraded = 0, placed = 0, removed = 0, ghPlant = 0, eastPlant = 0;
  for (const [seed, lv] of [[21, 10], [22, 17], [23, 20]]) {
    const r = prng(seed);
    let t = 2_000_000;
    const s = createState(t, seed);
    s.level = lv; s.coins = 200_000; s.quests.tut = QUESTS.length;
    s.inv = { "van-go": 30, "hop-dinh": 30, "thung-son": 12 };
    s.decor = { "chau-hoa": 2, "ghe-tre": 1, "den-long": 1, "gieng-da": 1, "cong-tre": 1 };
    for (let k = 0; k < 2000; k++) {
      t += Math.floor(r() * 60_000);
      const a = r() < 0.5 ? randomAction(r, s) : pickM3(r, s);
      const before = structuredClone(s);
      const res = apply(s, a, t);
      if (res.err) assert.deepEqual(s, before, `lỗi ${res.err} không được đổi trạng thái (${a.type})`);
      for (const e of res.events || []) {
        if (e.type === "buildStarted") built++;
        if (e.type === "upgradeStarted") upgraded++;
        if (e.type === "decorPlaced") placed++;
        if (e.type === "decorRemoved") removed++;
        if (e.type === "planted" && e.i >= 34) ghPlant++;
        if (e.type === "planted" && e.i >= 25 && e.i < 34) eastPlant++;
      }
      checkAll(s, before);
      if (k % 200 === 0) { const back = loadV3(dump(s, t), t); assert.deepEqual(back.buildings, s.buildings); assert.deepEqual(back.plots, s.plots); assert.deepEqual(back.decor, s.decor); Object.assign(s, back); }
    }
  }
  assert.ok(built >= 4 && upgraded >= 4 && placed >= 10 && removed >= 5 && ghPlant >= 5 && eastPlant >= 5, `quá ít thao tác M3: ${built} ${upgraded} ${placed} ${removed} ${ghPlant} ${eastPlant}`);
});

function pickM3(r, s) {
  const pick = (xs) => xs[Math.floor(r() * xs.length)];
  const k = r();
  if (k < 0.2) return { type: "startBuild", id: pick(["nha-kho", "nha-kinh", "dat-phia-dong", "xuong", "chuong-ga", "chuong-bo"]) };
  if (k < 0.35) return { type: "startUpgrade", id: pick(["nha-kho", "nha-kinh", "xuong", "sap-cho"]) };
  if (k < 0.5) return { type: "placeDecor", id: pick(DECOR).id, slot: pick(DECOR_SLOTS).id };
  if (k < 0.6) return { type: "removeDecor", slot: s.decorPlaced.length ? pick(s.decorPlaced).slot : pick(DECOR_SLOTS).id };
  if (k < 0.8) return { type: "plant", i: 25 + Math.floor(r() * 18), crop: pick(["mia", "mia", "ca-rot", "ngo"]) };
  if (k < 0.9) return { type: "harvestAll" };
  return { type: "sellAll" };
}

test("fuzz Milestone 4: 4 000 action chăn nuôi / làng qua apply() ở cấp 7 / 9 / 14 — bất biến, lỗi không đổi gì, lưu / tải giữ đàn + làng", () => {
  let bought = 0, collected = 0, talked = 0, claimed = 0;
  const NPCS = ["chi-ba", "co-hai", "bac-tu", "anh-ut", "__proto__", "x"];
  for (const [seed, lv] of [[31, 7], [32, 9], [33, 14]]) {
    const r = prng(seed), pick = (xs) => xs[Math.floor(r() * xs.length)];
    let t = 3_000_000;
    const s = createState(t, seed);
    s.level = lv; s.coins = 50_000; s.quests.tut = QUESTS.length;
    s.inv = { "thuc-an-gia-suc": 40, "bot-gao": 6, lua: 10, "banh-trung": 4, sua: 4 };
    apply(s, { type: "startBuild", id: "chuong-ga" }, t); apply(s, { type: "startBuild", id: "chuong-bo" }, t);
    for (let k = 0; k < 1333; k++) {
      t += Math.floor(r() * (r() < 0.1 ? 600_000 : 60_000));
      const uid = s.animals.list.length && r() < 0.85 ? pick(s.animals.list).uid : pick([0, 99, "1", -1]);
      const a = r() < 0.25 ? randomAction(r, s) : pick([
        { type: "buyAnimal", kind: pick(["ga", "bo-sua", "bo", "voi"]) }, { type: "feedAnimal", uid }, { type: "feedAll" }, { type: "feedAll", kind: "ga" },
        { type: "collectAnimal", uid }, { type: "collectAllAnimals" }, { type: "talkNpc", npc: pick(NPCS) },
        { type: "claimProgressQuest", id: s.village.prog.i < 6 ? ["xay-chuong-ga", "mua-ga-dau", "thu-trung-dau", "giao-don-trung-sua", "lam-banh-trung", "xay-chuong-bo"][s.village.prog.i] : "x" },
        { type: "claimChainStep", npc: pick(NPCS), step: pick([0, 1, 2, 3, -1]) },
        { type: "claimBoardQuest", uid: s.village.board.slots.length ? pick(s.village.board.slots).uid : 1 },
      ]);
      const before = structuredClone(s);
      const res = apply(s, a, t);
      if (res.err) assert.deepEqual(s, before, `lỗi ${res.err} không được đổi trạng thái (${a.type})`);
      for (const e of res.events || []) {
        if (e.type === "animalBought") bought++;
        if (e.type === "animalCollected") collected++;
        if (e.type === "npcTalked") talked++;
        if (e.type === "villageQuestClaimed") claimed++;
      }
      checkAll(s, before);
      if (k % 150 === 0) { const back = loadV3(dump(s, t), t); assert.deepEqual(back.animals, s.animals); assert.deepEqual(back.village, s.village); Object.assign(s, back); }
    }
  }
  assert.ok(bought >= 5 && collected >= 10 && talked >= 10 && claimed >= 1, `quá ít thao tác M4: ${bought} ${collected} ${talked} ${claimed}`);
});
