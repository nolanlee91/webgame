import test from "node:test";
import assert from "node:assert/strict";
import { SHOP, RESALE_MIN_RATIO } from "../data/shop.js?v=m8";
import { ITEM, ITEMS } from "../data/catalog.js?v=m8";
import { CROP } from "../data/crops.js?v=m8";
import { SAFETY_COOLDOWN_MS } from "../core/economy.js?v=m8";
import { apply } from "../core/apply.js?v=m8";
import { farm, act, err, START, CENTER } from "./helpers.mjs";

test("không vòng mua → bán có lời: mọi món chợ bán ra hoặc không bán lại được, hoặc giá mua ≥ 1,6 × giá bán lại", () => {
  for (const it of SHOP) {
    const resell = ITEM[it.id];
    if (resell) assert.ok(it.price >= RESALE_MIN_RATIO * resell.sell, it.id);
    const s = farm(); s.coins = 1000; s.level = 20;
    assert.equal(err(s, { type: "sell", id: it.id }), "bad", "hạt giống không bán lại được");
  }
  for (const it of ITEMS) if (it.buy !== undefined) assert.ok(it.buy >= RESALE_MIN_RATIO * it.sell, it.id);
});

test("mua hạt rồi thu hoạch ngay không được — lời chỉ đến sau thời gian trồng", () => {
  for (const it of SHOP.filter((x) => !CROP[x.crop].requires)) {
    const s = farm(); s.level = 20; s.coins = 1000; s.freeSeeds = 0;
    act(s, { type: "plant", i: CENTER, crop: it.crop });
    assert.equal(s.coins, 1000 - it.price);
    assert.equal(err(s, { type: "harvest", i: CENTER }, START + CROP[it.crop].growMs - 1), "growing");
    assert.equal(err(s, { type: "sellAll" }), "empty-stock");
  }
});

test("lưới an toàn: kẹt (xu < hạt rẻ nhất, ruộng trống, kho trống) ⇒ Chị Ba tặng 3 hạt cà rốt, tối đa 1 lần / 10 phút", () => {
  const s = farm();
  s.coins = 1; s.freeSeeds = 0;
  const r = act(s, { type: "tick" }, START + SAFETY_COOLDOWN_MS);
  assert.ok(r.events.some((e) => e.type === "gift" && e.seeds === 3));
  assert.equal(s.freeSeeds, 3);
  // trồng hết 3 hạt, thu, rồi lại kẹt ngay ⇒ chưa đủ 10 phút thì chưa tặng
  const t0 = START + SAFETY_COOLDOWN_MS;
  for (const i of [6, 7, CENTER]) act(s, { type: "plant", i, crop: "ca-rot" }, t0);
  act(s, { type: "harvestAll" }, t0 + 30_000);
  s.inv = {}; s.overflow = {};
  assert.equal(apply(s, { type: "tick" }, t0 + 60_000).events.some((e) => e.type === "gift"), false);
  assert.equal(s.freeSeeds, 0);
  assert.ok(act(s, { type: "tick" }, t0 + SAFETY_COOLDOWN_MS).events.some((e) => e.type === "gift"));
});

test("lưới an toàn không tặng khi còn đường đi: đủ xu, có cây đang trồng, hoặc còn hàng bán được", () => {
  const cases = [
    (s) => { s.coins = 2; },
    (s) => { s.plots[CENTER] = { open: true, crop: "ca-rot", plantAt: START, readyAt: START + 30_000, watered: false }; },
    (s) => { s.inv["ca-rot"] = 1; },
    (s) => { s.overflow["ca-rot"] = 1; },
  ];
  for (const setup of cases) {
    const s = farm(); s.coins = 0; s.freeSeeds = 0; setup(s);
    assert.equal(apply(s, { type: "tick" }, START + SAFETY_COOLDOWN_MS).events.some((e) => e.type === "gift"), false);
  }
  const s = farm(); s.coins = 0; s.freeSeeds = 0; s.inv["van-go"] = 3; // vật liệu không bán được ⇒ vẫn kẹt
  assert.ok(apply(s, { type: "tick" }, START + SAFETY_COOLDOWN_MS).events.some((e) => e.type === "gift"));
});

// ---------- Milestone 4: vật nuôi trong lưới an toàn ----------
import { stuck, animalsBusy } from "../core/economy.js?v=m8";

test("M4 lưới an toàn: gà đang làm trứng / trứng chờ thu / còn thức ăn cho con đói ⇒ không coi là kẹt", () => {
  const broke = () => { const s = farm(); s.coins = 0; s.freeSeeds = 0; s.inv = {}; s.overflow = {}; return s; };
  const base = broke();
  assert.equal(stuck(base), true, "không vật nuôi (save cũ, không có field animals) ⇒ vẫn kẹt như trước");
  base.animals = { list: [], nextUid: 1 };
  assert.equal(stuck(base), true, "đàn rỗng ⇒ vẫn kẹt");
  const hen = (fedAt) => ({ uid: 1, kind: "ga", fedAt, readyAt: fedAt === null ? null : fedAt + 240_000 });
  const producing = broke(); producing.animals = { list: [hen(START)], nextUid: 2 };
  assert.equal(animalsBusy(producing), true);
  assert.equal(stuck(producing), false, "gà đang làm trứng");
  const ready = broke(); ready.animals = { list: [hen(START - 999_999)], nextUid: 2 };
  assert.equal(stuck(ready), false, "trứng chín chờ thu");
  const hungryFeed = broke(); hungryFeed.animals = { list: [hen(null)], nextUid: 2 }; hungryFeed.inv["thuc-an-gia-suc"] = 1;
  assert.equal(stuck(hungryFeed), false, "gà đói nhưng còn thức ăn");
  const hungryNoFeed = broke(); hungryNoFeed.animals = { list: [hen(null)], nextUid: 2 };
  assert.equal(stuck(hungryNoFeed), true, "gà đói, hết thức ăn, hết xu, kho trống ⇒ kẹt thật");
  // qua apply(): không tặng hạt khi gà đang làm trứng
  assert.equal(apply(producing, { type: "tick" }, START + SAFETY_COOLDOWN_MS).events.some((e) => e.type === "gift"), false);
  assert.ok(apply(hungryNoFeed, { type: "tick" }, START + SAFETY_COOLDOWN_MS).events.some((e) => e.type === "gift"));
});
