// Fuzz: vài nghìn action ngẫu nhiên (hợp lệ lẫn rác) qua apply(), sau mỗi bước kiểm bất biến.
import test from "node:test";
import assert from "node:assert/strict";
import { apply, invariantError } from "../core/apply.js?v=m1";
import { createState, loadV3, dump } from "../core/state.js?v=m1";
import { used, capacity, overflowCount } from "../core/inventory.js?v=m1";
import { OVERFLOW_MAX } from "../data/warehouse.js?v=m1";
import { TUTORIAL } from "../data/quests.js?v=m1";
import { CROPS } from "../data/crops.js?v=m1";
import { ITEMS } from "../data/catalog.js?v=m1";

function prng(seed) { return () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296); }

function randomAction(r, s) {
  const pick = (xs) => xs[Math.floor(r() * xs.length)];
  const i = r() < 0.05 ? pick([-1, 25, "3", 2.5, null]) : Math.floor(r() * 25);
  const slotObj = () => { const all = [...s.orders.slots.map((x, k) => [k, x]), ...(s.orders.special ? [["special", s.orders.special]] : [])]; return all.length ? pick(all) : [0, { rev: 0 }]; };
  switch (Math.floor(r() * 14)) {
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
    default: return { type: "claimQuest", id: pick(TUTORIAL).id };
  }
}

function checkAll(s, before) {
  assert.equal(invariantError(s, before), null);
  assert.ok(Number.isSafeInteger(s.coins) && s.coins >= 0, "xu ≥ 0");
  for (const bag of [s.inv, s.overflow]) for (const q of Object.values(bag)) assert.ok(Number.isInteger(q) && q >= 0, "số món nguyên ≥ 0");
  assert.ok(overflowCount(s) <= OVERFLOW_MAX);
  assert.ok(used(s) <= Math.max(capacity(s), used(before)), "kho ≤ sức chứa (+ giỏ tràn riêng)");
  assert.ok(s.quests.tut >= before.quests.tut, "nhiệm vụ không lùi");
  const ids = [...s.orders.slots.map((x) => x.order?.id), s.orders.special?.order?.id].filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, "không trùng id đơn");
}

test("fuzz 6 000 action ngẫu nhiên × 3 hạt giống: bất biến luôn đúng, không giao/nhận trùng", () => {
  let total = 0;
  for (const seed of [1, 2, 3]) {
    const r = prng(seed);
    let t = 1_000_000;
    const s = createState(t, seed);
    s.coins = seed === 3 ? 0 : 200; // một lượt bắt đầu cháy túi để thử lưới an toàn
    if (seed === 2) s.level = 11;
    if (seed === 1) s.inv["ngo"] = 58; // gần đầy kho ⇒ thử giỏ tràn
    const claimed = new Set(), delivered = new Set();
    for (let k = 0; k < 2000; k++) {
      t += Math.floor(r() * 20_000);
      const a = randomAction(r, s);
      const before = structuredClone(s);
      const res = apply(s, a, t);
      total++;
      if (res.err) assert.deepEqual(s, before, `lỗi ${res.err} không được đổi trạng thái (${a.type})`);
      for (const e of res.events || []) {
        if (e.type === "questClaimed") { assert.ok(!claimed.has(e.id), "nhận thưởng 2 lần"); claimed.add(e.id); }
        if (e.type === "delivered") { assert.ok(!delivered.has(e.id), "giao trùng đơn"); delivered.add(e.id); }
      }
      checkAll(s, before);
      if (k % 250 === 0) { // lưu / tải giữa chừng không làm hỏng gì
        const back = loadV3(dump(s, t), t);
        assert.equal(back.coins, s.coins);
        assert.deepEqual(back.inv, s.inv);
        Object.assign(s, back);
      }
    }
  }
  assert.equal(total, 6000);
});
