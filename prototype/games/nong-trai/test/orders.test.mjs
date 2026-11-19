import test from "node:test";
import assert from "node:assert/strict";
import * as O from "../core/orders.js?v=m2";
import { orderSlotCount, cropUnlocked } from "../core/progression.js?v=m2";
import { loadV3, dump } from "../core/state.js?v=m2";
import { apply } from "../core/apply.js?v=m2";
import { CANCEL_REFILL_MS, SPECIAL_COOLDOWN_MS } from "../data/orders.js?v=m2";
import { NPC } from "../data/npcs.js?v=m2";
import { farm, act, err, START } from "./helpers.mjs";

const board = (s) => O.boardView(s).slots;
const tick = (s, t) => act(s, { type: "tick" }, t);
/** Người chơi ở cấp `lv`, bảng đơn đã đồng bộ. */
function atLevel(lv, seed = 3, t = START) { const s = farm(seed, t); s.level = lv; tick(s, t); return s; }

test("người mới: 3 đơn dễ, chỉ món đã mở, đơn đầu của Bác Tư — 2 cà rốt, 15 xu", () => {
  const s = farm();
  const b = board(s);
  assert.equal(b.length, 3);
  assert.deepEqual(b[0].order.items, { "ca-rot": 2 });
  assert.equal(b[0].order.npc, "bac-tu");
  assert.equal(b[0].order.coins, 15);
  for (const x of b) {
    assert.ok(Object.keys(x.order.items).every((id) => cropUnlocked(s, id)));
    assert.equal(x.ready, false);
    assert.ok(NPC[x.order.npc]);
  }
  assert.equal(s.orders.special, null);
});

test("số ô đơn theo cấp: 3, +1 ở cấp 3, 6, 11, tối đa 6; lên cấp ⇒ ô mới có đơn ngay", () => {
  assert.deepEqual([1, 2, 3, 5, 6, 10, 11, 20].map(orderSlotCount), [3, 3, 4, 4, 5, 5, 6, 6]);
  const s = farm();
  s.level = 2; s.xp = 27; s.inv["ca-rot"] = 2;
  const r = act(s, { type: "deliver", slot: 0, id: s.orders.slots[0].order.id, rev: s.orders.slots[0].rev });
  assert.ok(r.events.some((e) => e.type === "levelUp" && e.level === 3));
  assert.equal(s.orders.slots.length, 4);
  assert.ok(s.orders.slots.every((x) => x.order));
});

test("chỉ yêu cầu món đã mở (mọi cấp 1–20), không bao giờ có mía khi chưa có Nhà kính", () => {
  for (let lv = 1; lv <= 20; lv++) {
    const s = atLevel(lv, lv * 11);
    for (let k = 0; k < 40; k++) {
      for (const type of ["thuong", "ket-hop", "dac-biet"]) {
        const o = O.generate(s, type, START);
        if (!o) continue;
        for (const id of Object.keys(o.items)) assert.ok(cropUnlocked(s, id), `cấp ${lv}: ${id}`);
        assert.ok(!("mia" in o.items));
        if (lv < 6) assert.ok(!("lua" in o.items));
      }
    }
  }
});

test("đơn kết hợp chỉ từ cấp 5 (3–4 món, Bác Tư, ×1,3), tối đa 2 cùng lúc; đặc biệt chưa có trước cấp 11", () => {
  const cycle = (s, n = 300) => {
    const types = new Set();
    for (let k = 0; k < n; k++) {
      const slot = k % s.orders.slots.length, x = s.orders.slots[slot];
      act(s, { type: "cancelOrder", slot, id: x.order.id, rev: x.rev }, START + k * CANCEL_REFILL_MS);
      tick(s, START + (k + 1) * CANCEL_REFILL_MS);
      assert.ok(s.orders.slots.filter((y) => y.order?.type === "ket-hop").length <= 2);
      for (const y of s.orders.slots) if (y.order) {
        types.add(y.order.type);
        if (y.order.type === "ket-hop") {
          const n = Object.keys(y.order.items).length;
          assert.ok(n >= 3 && n <= 4);
          assert.equal(y.order.npc, "bac-tu");
          assert.equal(y.order.coins, Math.ceil(O.priceOrder(y.order).value * 1.3 - 1e-9));
        }
      }
    }
    return types;
  };
  const s4 = atLevel(4);
  assert.deepEqual([...cycle(s4)], ["thuong"]);
  assert.equal(s4.orders.special, null);
  const s5 = atLevel(5, 9);
  assert.ok(cycle(s5).has("ket-hop"));
  assert.equal(s5.orders.special, null);
});

test("đơn kết hợp XP ×1,5 so với đơn thường cùng món", () => {
  const items = { "ca-rot": 2, "ca-chua": 2, "dau-tay": 1 };
  const a = O.priceOrder({ type: "thuong", items, mult: 1.2 }), b = O.priceOrder({ type: "ket-hop", items, mult: 1.3 });
  assert.equal(b.xp, Math.ceil(a.xp * 1.5));
});

test("đơn thường thưởng ×1,15–1,2 giá chợ; tối đa 2 loại món", () => {
  const s = atLevel(4, 5);
  for (let k = 0; k < 200; k++) {
    const o = O.generate(s, "thuong", START);
    const { value } = O.priceOrder(o);
    assert.ok(o.mult >= 1.15 && o.mult <= 1.2);
    assert.ok(o.coins >= value * 1.15 && o.coins <= Math.ceil(value * 1.2));
    assert.ok(Object.keys(o.items).length <= 2);
  }
});

test("số lượng theo sản lượng thật: ruộng 9 ô đòi ít hơn ruộng 25 ô", () => {
  const small = atLevel(1), big = atLevel(1);
  big.plots.forEach((p) => (p.open = true));
  const maxQ = (s) => { let m = 0; for (let k = 0; k < 200; k++) m = Math.max(m, ...Object.values(O.generate(s, "thuong", START).items)); return m; };
  assert.ok(maxQ(small) <= O.cropUnit(small, "ca-rot"));
  assert.ok(O.cropUnit(big, "ca-rot") > O.cropUnit(small, "ca-rot"));
  assert.ok(maxQ(big) > maxQ(small));
});

test("đơn đặc biệt: cấp 11, tối đa 1, hạn 2 giờ, ×1,35 + vật liệu; hết hạn chỉ mất đơn, không phạt", () => {
  const s = atLevel(11, 21);
  const sp = s.orders.special;
  assert.ok(sp.order);
  assert.equal(sp.order.type, "dac-biet");
  assert.equal(sp.order.npc, "anh-ut");
  assert.equal(sp.order.expiresAt - sp.order.createdAt, 2 * 3600_000);
  assert.ok(Object.keys(sp.order.materials).length >= 1);
  assert.equal(sp.order.coins, Math.ceil(O.priceOrder(sp.order).value * 1.35 - 1e-9));
  assert.equal(O.allOrders(s).filter((o) => o.type === "dac-biet").length, 1);
  assert.equal(s.orders.slots.length, 6);
  const coins = s.coins, inv = JSON.stringify(s.inv);
  const r = tick(s, sp.order.expiresAt);
  assert.ok(r.events.some((e) => e.type === "orderExpired"));
  assert.equal(s.orders.special.order, null);
  assert.equal(s.coins, coins);
  assert.equal(JSON.stringify(s.inv), inv);
  tick(s, START + 2 * 3600_000 + SPECIAL_COOLDOWN_MS - 1);
  assert.equal(s.orders.special.order, null);
  tick(s, START + 2 * 3600_000 + SPECIAL_COOLDOWN_MS);
  assert.ok(s.orders.special.order);
});

test("giao đơn đặc biệt: nhận vật liệu; đúng lúc hết hạn thì không giao được", () => {
  const s = atLevel(11, 21);
  for (const [id, q] of Object.entries(s.orders.special.order.items)) s.inv[id] = q;
  const { id, expiresAt, materials } = s.orders.special.order, rev = s.orders.special.rev;
  assert.ok(err(s, { type: "deliver", slot: "special", id, rev }, expiresAt));
  act(s, { type: "deliver", slot: "special", id, rev });
  for (const [m, q] of Object.entries(materials)) assert.equal(s.inv[m], q);
  assert.equal(s.orders.special.order, null);
});

test("không trừ hàng trước khi Giao; giao trừ đúng + trả thưởng; id+rev chặn giao trùng, kể cả sau khi tải lại", () => {
  const s = farm();
  const first = board(s)[0];
  assert.equal(err(s, { type: "deliver", slot: 0, id: first.order.id, rev: first.rev }), "order-stock");
  s.inv = { "ca-rot": 3, "ca-chua": 1 };
  assert.equal(board(s)[0].ready, true);
  assert.deepEqual(s.inv, { "ca-rot": 3, "ca-chua": 1 }, "xem bảng đơn không trừ hàng");
  const coins = s.coins;
  const r = act(s, { type: "deliver", slot: 0, id: first.order.id, rev: first.rev });
  assert.equal(r.result.coins, 15);
  assert.equal(s.coins, coins + 15);
  assert.deepEqual(s.inv, { "ca-rot": 1, "ca-chua": 1 });
  assert.equal(s.stats.delivered, 1);
  assert.notEqual(s.orders.slots[0].order.id, first.order.id);
  assert.equal(err(s, { type: "deliver", slot: 0, id: first.order.id, rev: first.rev }), "order-changed");
  const again = loadV3(dump(s, START), START);
  assert.equal(apply(again, { type: "deliver", slot: 0, id: first.order.id, rev: first.rev }, START).err, "order-changed");
  const cur = s.orders.slots[0];
  assert.equal(err(s, { type: "deliver", slot: 0, id: cur.order.id, rev: cur.rev - 1 }), "order-changed");
  assert.equal(err(s, { type: "deliver", slot: 7, id: cur.order.id, rev: cur.rev }), "order-changed");
  assert.equal(err(s, { type: "deliver", slot: "0", id: cur.order.id, rev: cur.rev }), "order-changed");
});

test("giao đơn lấy cả hàng trong giỏ tràn", () => {
  const s = farm();
  s.overflow = { "ca-rot": 2 };
  const x = s.orders.slots[0];
  act(s, { type: "deliver", slot: 0, id: x.order.id, rev: x.rev });
  assert.deepEqual(s.overflow, {});
});

test("bỏ đơn: ô trống, đơn mới đúng sau 2 phút, giữ qua lưu/tải (offline)", () => {
  const s = farm();
  const x = s.orders.slots[1];
  act(s, { type: "cancelOrder", slot: 1, id: x.order.id, rev: x.rev });
  assert.equal(s.orders.slots[1].order, null);
  assert.equal(s.orders.slots[1].refillAt, START + CANCEL_REFILL_MS);
  assert.equal(err(s, { type: "cancelOrder", slot: 1, id: x.order.id, rev: x.rev }), "order-changed");
  tick(s, START + CANCEL_REFILL_MS - 1);
  assert.equal(s.orders.slots[1].order, null);
  const reopened = loadV3(dump(s, START + 1000), START + 60 * 60_000); // tắt trang 1 giờ
  assert.equal(reopened.orders.slots[1].order, null);
  const r = act(reopened, { type: "tick" }, START + 60 * 60_000);
  assert.ok(r.events.some((e) => e.type === "orderNew" && e.slot === 1));
  assert.ok(reopened.orders.slots[1].order);
});
