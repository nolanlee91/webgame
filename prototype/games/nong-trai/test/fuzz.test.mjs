// Fuzz: vài nghìn action ngẫu nhiên (hợp lệ lẫn rác) qua apply(), sau mỗi bước kiểm bất biến.
import test from "node:test";
import assert from "node:assert/strict";
import { apply, invariantError } from "../core/apply.js?v=m2";
import { createState, loadV3, dump } from "../core/state.js?v=m2";
import { used, capacity, overflowCount } from "../core/inventory.js?v=m2";
import { OVERFLOW_MAX } from "../data/warehouse.js?v=m2";
import { TUTORIAL } from "../data/quests.js?v=m2";
import { CROPS } from "../data/crops.js?v=m2";
import { ITEMS } from "../data/catalog.js?v=m2";
import { MACHINES } from "../data/machines.js?v=m2";
import { RECIPES } from "../data/recipes.js?v=m2";
import { QUESTS } from "../data/quests.js?v=m2";
import { capacity as queueCap } from "../core/production.js?v=m2";
import { extraSlots } from "../core/workshop.js?v=m2";

function prng(seed) { return () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296); }

function randomAction(r, s) {
  const pick = (xs) => xs[Math.floor(r() * xs.length)];
  const i = r() < 0.05 ? pick([-1, 25, "3", 2.5, null]) : Math.floor(r() * 25);
  const slotObj = () => { const all = [...s.orders.slots.map((x, k) => [k, x]), ...(s.orders.special ? [["special", s.orders.special]] : [])]; return all.length ? pick(all) : [0, { rev: 0 }]; };
  const mid = r() < 0.05 ? pick(["__proto__", "x", undefined]) : r() < 0.6 ? pick(["bep-sen", "coi-xay"]) : pick(MACHINES).id;
  const q = s.production.machines[mid]?.queue || [];
  switch (Math.floor(r() * 24)) {
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
    case 12: return { type: pick(["upgradeWarehouse", "upgradeFarm", "tick", "nope"]) };
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
        if (k === 0) apply(s, { type: "buildWorkshop" }, t);
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
        Object.assign(s, back);
      }
    }
  }
  assert.equal(total, 10_000);
  assert.ok(enqOk > 20 && collectedOk > 10 && marketOk > 20, `quá ít thao tác Xưởng / chợ: ${enqOk} ${collectedOk} ${marketOk}`);
});
