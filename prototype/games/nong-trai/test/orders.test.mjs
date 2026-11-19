import test from "node:test";
import assert from "node:assert/strict";
import * as O from "../core/orders.js?v=m4";
import { orderSlotCount, cropUnlocked, xpNeed } from "../core/progression.js?v=m4";
import { loadV3, dump } from "../core/state.js?v=m4";
import { apply } from "../core/apply.js?v=m4";
import { CANCEL_REFILL_MS, SPECIAL_COOLDOWN_MS } from "../data/orders.js?v=m4";
import { NPC } from "../data/npcs.js?v=m4";
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
  s.level = 2; s.xp = xpNeed(2) - 1; s.inv["ca-rot"] = 2;
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

// ---------- Milestone 4: trứng / sữa trong đơn, delivered.items ----------
import * as V4 from "../core/village.js?v=m4";
import { MACHINE as MACHINE4 } from "../data/machines.js?v=m4";
import { CURRENT_MILESTONE as CM4 } from "../data/levels.js?v=m4";

const machine = () => ({ level: 1, slots: 2, readyAt: 0, queue: [], nextUid: 1 });
/** Cấp `lv`, có Cối xay + Lò bánh (+ Máy bơ sữa) đã xây, đàn `herd` = { ga: n, "bo-sua": n }. */
function ranch(lv, herd = {}, seed = 5) {
  const s = atLevel(lv, seed);
  for (const id of ["coi-xay", "lo-banh", "may-bo-sua"]) s.production.machines[id] = machine();
  let uid = 1;
  s.animals = { list: [], nextUid: 1 };
  for (const [kind, n] of Object.entries(herd)) for (let k = 0; k < n; k++) s.animals.list.push({ uid: uid++, kind, fedAt: null, readyAt: null });
  s.animals.nextUid = uid;
  return s;
}
const EGG_GOODS = ["trung-ga", "banh-trung", "banh-bi-ngo"], MILK_GOODS = ["sua", "bo", "pho-mai"];

test("M4 đơn: không có vật nuôi ⇒ không bao giờ đòi trứng / sữa / món từ chúng, chuỗi sinh đơn y như cũ", () => {
  const a = ranch(16), b = ranch(16);
  delete a.animals; // save M1–M3: không có field animals
  const items = O.orderableItems(b, START);
  for (const id of [...EGG_GOODS, ...MILK_GOODS, "banh-flan"]) assert.ok(!items.includes(id), id);
  for (let k = 0; k < 60; k++) {
    for (const type of ["thuong", "ket-hop", "dac-biet"]) {
      const oa = O.generate(a, type, START), ob = O.generate(b, type, START);
      assert.deepEqual(oa, ob, "cùng seed ⇒ cùng đơn dù có / không có field animals rỗng");
      for (const id of Object.keys(oa?.items || {})) assert.ok(![...EGG_GOODS, ...MILK_GOODS].includes(id), id);
    }
  }
});

test("M4 đơn: có gà ⇒ trứng + bánh trứng / bánh bí ngô vào đơn; có bò ⇒ sữa (+ bơ / phô mai khi Máy bơ sữa đã vào bản)", () => {
  const s = ranch(12, { ga: 2 });
  const items = O.orderableItems(s, START);
  for (const id of EGG_GOODS) assert.ok(items.includes(id), id);
  for (const id of MILK_GOODS) assert.ok(!items.includes(id), "chưa có bò ⇒ không " + id);
  const c = ranch(12, { ga: 2, "bo-sua": 1 });
  const all = O.orderableItems(c, START);
  assert.ok(all.includes("sua"));
  const butterLive = MACHINE4["may-bo-sua"].milestone <= CM4;
  for (const id of ["bo", "pho-mai"]) assert.equal(all.includes(id), butterLive, `${id}: Máy bơ sữa milestone ${MACHINE4["may-bo-sua"].milestone}, bản ${CM4}`);
  assert.ok(!all.includes("banh-flan"), "flan cần Lò bánh cấp 2 + đường");
  // chỉ món làm được: Lò bánh chưa xây ⇒ có trứng nhưng không có bánh
  const noOven = ranch(12, { ga: 1 });
  delete noOven.production.machines["lo-banh"];
  const ni = O.orderableItems(noOven, START);
  assert.ok(ni.includes("trung-ga") && !ni.includes("banh-trung") && !ni.includes("banh-bi-ngo"));
  // kind cũ "bo" (trước khi đổi tên) vẫn là bò sữa
  const legacy = ranch(12);
  legacy.animals.list.push({ uid: 1, kind: "bo", fedAt: null, readyAt: null });
  assert.deepEqual(O.animalGoods(legacy), { sua: 1 });
  // sinh nhiều đơn ⇒ thực sự xuất hiện trứng / sữa / bánh trứng
  const seen = new Set();
  for (let k = 0; k < 400; k++) for (const type of ["thuong", "ket-hop", "dac-biet"]) Object.keys(O.generate(c, type, START)?.items || {}).forEach((id) => seen.add(id));
  for (const id of ["trung-ga", "sua", "banh-trung"]) assert.ok(seen.has(id), "chưa thấy " + id);
});

test("M4 đơn: số lượng theo đàn thật — 1 gà ⇒ tối đa 1 trứng / 1 bánh trứng mỗi đơn; 6 gà ⇒ nhiều hơn nhưng ≤ 8", () => {
  const one = ranch(12, { ga: 1 }), six = ranch(12, { ga: 6 }, 9);
  assert.equal(O.animalUnit(one, "trung-ga"), 1);
  assert.equal(O.animalUnit(six, "trung-ga"), 6);
  assert.equal(O.productUnit(one, "banh-trung"), 1, "2 trứng / bánh, 1 gà ⇒ 1 bánh");
  assert.equal(O.productUnit(six, "banh-trung"), 2, "vẫn kẹp theo hàng chờ máy (2 ô)");
  let maxSix = 0;
  for (let k = 0; k < 300; k++) {
    for (const type of ["thuong", "ket-hop", "dac-biet"]) {
      const o1 = O.generate(one, type, START), o6 = O.generate(six, type, START);
      if (o1?.items["trung-ga"]) assert.equal(o1.items["trung-ga"], 1);
      if (o1?.items["banh-trung"]) assert.equal(o1.items["banh-trung"], 1);
      if (o1?.items["banh-bi-ngo"]) assert.equal(o1.items["banh-bi-ngo"], 1);
      if (o6?.items["trung-ga"]) { assert.ok(o6.items["trung-ga"] <= 8); maxSix = Math.max(maxSix, o6.items["trung-ga"]); }
    }
  }
  assert.ok(maxSix >= 3, "đàn 6 gà ⇒ đơn đòi được ≥ 3 trứng");
});

test("M4 delivered: sự kiện có items (bản sao), orderType, npc ⇒ nhiệm vụ giao-don-trung-sua và Bác Tư bước 3 đếm được", () => {
  const s = ranch(12, { ga: 1 });
  const x = s.orders.slots[0];
  x.order = { id: 900, type: "ket-hop", npc: "bac-tu", items: { "trung-ga": 1, "banh-trung": 1, "ca-rot": 2 }, mult: 1.3, coins: 0, xp: 0, materials: {}, createdAt: START, expiresAt: null };
  Object.assign(x.order, O.priceOrder(x.order));
  s.inv = { "trung-ga": 1, "banh-trung": 1, "ca-rot": 2 };
  const ev = [];
  const r = O.deliver(s, 0, 900, x.rev, START, ev);
  assert.ok(r.ok, r.err);
  const d = ev.find((e) => e.type === "delivered");
  assert.deepEqual(d.items, { "trung-ga": 1, "banh-trung": 1, "ca-rot": 2 });
  assert.equal(d.orderType, "ket-hop");
  assert.equal(d.npc, "bac-tu");
  d.items["trung-ga"] = 99;
  assert.notEqual(s.orders.slots[0].order?.items?.["trung-ga"], 99, "items là bản sao, không phải tham chiếu");
  d.items["trung-ga"] = 1;
  // nhiệm vụ M4 đếm từ sự kiện thật
  const vs = V4.createVillage(), c = { level: 14, seed: 1, buildings: {}, tutorialDone: true };
  vs.prog.i = 3; // giao-don-trung-sua
  vs.chains["bac-tu"].step = 2; // "Giao 1 đơn kết hợp có bánh"
  const out = V4.track(vs, ev, c);
  assert.ok(out.some((e) => e.type === "villageQuestDone" && e.id === "giao-don-trung-sua"));
  assert.ok(out.some((e) => e.type === "villageQuestDone" && e.id === "tu-3"));
});
