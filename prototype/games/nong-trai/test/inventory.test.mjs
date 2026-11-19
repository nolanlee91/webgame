import test from "node:test";
import assert from "node:assert/strict";
import * as I from "../core/inventory.js?v=m2";
import { WAREHOUSE, OVERFLOW_MAX } from "../data/warehouse.js?v=m2";
import { farm, act, err, START, CENTER } from "./helpers.mjs";

const full = (s, n = I.capacity(s)) => { s.inv["ca-chua"] = n; };

test("sức chứa 60 lúc đầu, các mốc nâng 90/130/180/250 có trong dữ liệu", () => {
  const s = farm();
  assert.equal(I.capacity(s), 60);
  assert.deepEqual(WAREHOUSE.map((w) => w.cap), [60, 90, 130, 180, 250]);
  assert.equal(OVERFLOW_MAX, 10);
});

test("vật liệu không tính vào sức chứa", () => {
  const s = farm();
  s.inv["van-go"] = 500; s.inv["ca-rot"] = 3;
  assert.equal(I.used(s), 3);
});

test("kho đầy không chặn thu hoạch: hàng vào giỏ tràn (tối đa 10), đầy giỏ mới chặn", () => {
  const s = farm();
  full(s);
  s.level = 2; s.coins = 1e6;
  for (let k = 0; k < 11; k++) {
    act(s, { type: "plant", i: CENTER, crop: "ca-rot" }, START);
    const r = k < 10 ? act(s, { type: "harvest", i: CENTER }, START + 30_000) : null;
    if (r) assert.equal(r.events.find((e) => e.type === "harvested").overflow, true);
  }
  assert.equal(I.overflowCount(s), 10);
  assert.equal(I.used(s), 60);
  assert.equal(err(s, { type: "harvest", i: CENTER }, START + 30_000), "basket-full");
  assert.equal(s.plots[CENTER].crop, "ca-rot", "cây vẫn nằm trên ruộng, không mất");
});

test("bán nhanh giỏ tràn trả đúng giá; bán bớt kho ⇒ giỏ tràn tự về kho", () => {
  const s = farm();
  full(s);
  s.overflow = { "ca-rot": 4 };
  const coins = s.coins;
  const r = act(s, { type: "sellOverflow" });
  assert.equal(r.result.coins, 24);
  assert.equal(s.coins, coins + 24);
  assert.equal(I.overflowCount(s), 0);
  assert.equal(err(s, { type: "sellOverflow" }), "basket-empty");
  s.overflow = { "ca-rot": 4 };
  const r2 = act(s, { type: "sell", id: "ca-chua", n: 3 });
  assert.ok(r2.events.some((e) => e.type === "overflowSettled" && e.count === 3));
  assert.equal(s.overflow["ca-rot"], 1);
  assert.equal(s.inv["ca-rot"], 3);
  assert.equal(I.used(s), 60);
});

test("bán: số lượng phải hợp lệ, không bán quá số có, vật liệu không bán", () => {
  const s = farm();
  s.inv["ca-rot"] = 2; s.inv["van-go"] = 1;
  assert.equal(err(s, { type: "sell", id: "ca-rot", n: 3 }), "empty-stock");
  assert.equal(err(s, { type: "sell", id: "ca-rot", n: -1 }), "bad");
  assert.equal(err(s, { type: "sell", id: "ca-rot", n: 1.5 }), "bad");
  assert.equal(err(s, { type: "sell", id: "van-go" }), "bad");
  assert.equal(err(s, { type: "sell", id: "hat-ca-rot" }), "bad");
  assert.equal(act(s, { type: "sell", id: "ca-rot" }).result.coins, 12);
  assert.equal(s.inv["ca-rot"], undefined);
  assert.equal(err(s, { type: "sell", id: "ca-rot", n: 1 }), "empty-stock");
});

test("bán hết: kho + giỏ tràn, giữ vật liệu", () => {
  const s = farm();
  s.inv = { "ca-rot": 2, "ca-chua": 1, "hop-dinh": 2 };
  s.overflow = { "ca-rot": 1 };
  assert.deepEqual(act(s, { type: "sellAll" }).result, { ok: true, count: 4, coins: 30 });
  assert.deepEqual(s.inv, { "hop-dinh": 2 });
  assert.equal(err(s, { type: "sellAll" }), "empty-stock");
});

test("nâng kho: cần cấp, xu, vật liệu; không trừ khi thiếu", () => {
  const s = farm();
  s.coins = 1000;
  assert.equal(err(s, { type: "upgradeWarehouse" }), "warehouse-level");
  s.level = 2;
  act(s, { type: "upgradeWarehouse" });
  assert.equal(I.capacity(s), 90);
  assert.equal(s.coins, 920);
  s.level = 6;
  assert.equal(err(s, { type: "upgradeWarehouse" }), "materials");
  assert.equal(s.coins, 920);
  s.inv["van-go"] = 2; s.inv["hop-dinh"] = 3;
  act(s, { type: "upgradeWarehouse" });
  assert.equal(I.capacity(s), 130);
  assert.deepEqual(s.inv, { "hop-dinh": 1 });
  s.coins = 10;
  s.level = 15;
  assert.equal(err(s, { type: "upgradeWarehouse" }), "coins");
});

test("kho cũ (v2) vượt sức chứa được giữ, chỉ hàng mới bị đẩy sang giỏ tràn", () => {
  const s = farm();
  s.inv["ca-rot"] = 200;
  act(s, { type: "plant", i: CENTER, crop: "ca-rot" });
  const r = act(s, { type: "harvest", i: CENTER }, START + 30_000);
  assert.equal(r.events[0].overflow, true);
  assert.equal(s.inv["ca-rot"], 200);
  assert.equal(s.overflow["ca-rot"], 1);
});

test("bag(): count / has / take (không đủ thì không trừ) / add (đầy hẳn thì không thêm)", () => {
  const s = farm();
  const b = I.bag(s);
  assert.deepEqual(b.add("ca-rot", 3), { ok: true, overflow: 0 });
  assert.equal(b.count("ca-rot"), 3);
  assert.ok(b.has("ca-rot", 3) && !b.has("ca-rot", 4));
  assert.equal(b.take("ca-rot", 4), false);
  assert.equal(b.count("ca-rot"), 3);
  assert.equal(b.take("ca-rot", 2), true);
  s.inv["ca-chua"] = 59;
  assert.deepEqual(b.add("ca-rot", 5), { ok: true, overflow: 5 });
  assert.deepEqual(b.add("ca-rot", 6), { ok: false, overflow: 0 });
  assert.deepEqual(b.add("nope", 1), { ok: false, overflow: 0 });
});
