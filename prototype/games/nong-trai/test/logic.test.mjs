import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";
import { farmSave } from "../save.js";

const start = 1_000_000;
const center = 12;

test("ruộng mới có chín ô, xu và ba hạt cà rốt miễn phí", () => {
  const farm = L.newFarm(start);
  assert.equal(farm.plots.length, 25);
  assert.equal(farm.plots.filter((plot) => plot.open).length, 9);
  assert.equal(farm.coins, L.START_COINS);
  assert.equal(farm.freeSeeds, 3);
});

test("gieo đúng giống, ưu tiên hạt tặng và trừ xu khi hết hạt", () => {
  const farm = L.newFarm(start);
  for (const plot of [6, 7, center]) {
    assert.deepEqual(L.plant(farm, plot, "ca-rot", start), { ok: true, cost: 0 });
    assert.equal(farm.plots[plot].crop, "ca-rot");
  }
  assert.equal(farm.coins, L.START_COINS);
  assert.equal(farm.freeSeeds, 0);
  assert.deepEqual(L.plant(farm, 8, "ca-chua", start), { ok: true, cost: 5 });
  assert.equal(farm.coins, L.START_COINS - 5);
});

test("gieo bị chặn khi thiếu xu, ô đã trồng, ô khóa hoặc giống chưa mở", () => {
  const farm = L.newFarm(start);
  L.plant(farm, center, "ca-rot", start);
  farm.coins = 0;
  assert.equal(L.plant(farm, 6, "ca-chua", start).err, "coins");
  assert.equal(L.plant(farm, center, "ca-chua", start).err, "busy");
  assert.equal(L.plant(farm, 0, "ca-rot", start).err, "locked");
  assert.equal(L.plant(farm, 7, "bi-ngo", start).err, "level");
  assert.equal(L.plant(farm, 7, "__proto__", start).err, "bad");
  assert.equal(farm.coins, 0);
});

test("mỗi giống phát triển qua năm giai đoạn và chín đúng thời điểm", () => {
  for (const crop of L.CROPS) {
    const farm = L.newFarm(start);
    farm.level = crop.level;
    L.plant(farm, center, crop.id, start);
    const plot = farm.plots[center];
    const sample = (ratio) => L.stage(plot, start + crop.growMs * ratio);
    assert.deepEqual([0, .3, .6, .85, 1].map(sample), ["seed", "sprout", "grow", "mature", "ready"]);
    assert.equal(L.harvest(farm, center, start + crop.growMs - 1).err, "growing");
  }
});

test("tưới một lần rút ngắn 30% thời gian còn lại, tiến độ không tụt", () => {
  const farm = L.newFarm(start);
  L.plant(farm, center, "ca-rot", start);
  const now = start + 10_000;
  const before = L.progress(farm.plots[center], now);
  assert.deepEqual(L.water(farm, center, now), { ok: true, saved: 6000 });
  assert.ok(L.progress(farm.plots[center], now) >= before);
  assert.equal(L.water(farm, center, now).err, "watered");
  assert.equal(L.water(farm, center, start + 24_000).err, "ready");
});

test("thu hoạch đưa nông sản vào kho, cộng XP đúng một lần, chưa cộng xu", () => {
  const farm = L.newFarm(start);
  L.plant(farm, center, "ca-rot", start);
  assert.equal(L.harvest(farm, center, start + 30_000).xp, 2);
  assert.equal(L.harvest(farm, center, start + 30_000).err, "empty");
  assert.equal(farm.stock["ca-rot"], 1);
  assert.equal(farm.coins, L.START_COINS);
  assert.equal(farm.xp, 2);
});

test("thu hết chỉ lấy ô đã chín và có thể mở khóa giống khi lên cấp", () => {
  const farm = L.newFarm(start);
  farm.xp = 8;
  L.plant(farm, center, "ca-rot", start);
  L.plant(farm, 6, "ca-chua", start);
  const result = L.harvestAll(farm, start + 30_000);
  assert.deepEqual(result.plots, [center]);
  assert.deepEqual(result.unlocked, ["dau-tay"]);
  assert.equal(farm.level, 2);
  assert.equal(farm.plots[6].crop, "ca-chua");
});

test("bán hết trả đúng giá, trừ kho và không thể bán lại sau khi tải", () => {
  const farm = L.newFarm(start);
  farm.stock["ca-rot"] = 2;
  farm.stock["ca-chua"] = 1;
  assert.deepEqual(L.sell(farm), { ok: true, count: 3, coins: 24 });
  assert.equal(farm.coins, L.START_COINS + 24);
  assert.equal(farm.stats.earned, 24);
  const reopened = L.load(L.dump(farm, start), start);
  assert.equal(L.sell(reopened).err, "empty-stock");
  assert.equal(reopened.coins, farm.coins);
});

test("mở rộng chỉ mở ô kề và nâng cấp trang trí yêu cầu đủ cấp, đủ xu", () => {
  const farm = L.newFarm(start);
  assert.equal(L.buyPlot(farm, 0).err, "far");
  assert.equal(L.buyPlot(farm, 2).err, "coins");
  assert.equal(L.upgradeFarm(farm).err, "upgrade-level");
  farm.level = 2;
  assert.equal(L.upgradeFarm(farm).err, "coins");
  farm.coins = 100;
  assert.deepEqual(L.buyPlot(farm, 2), { ok: true, cost: 30 });
  assert.ok(farm.plots[2].open);
  assert.equal(L.upgradeFarm(farm).name, L.UPGRADES[0].name);
  assert.equal(farm.coins, 42);
  assert.equal(farm.upgrade, 1);
});

test("sau khi offline vẫn giữ kho, xu, tiến độ và chín theo timestamp", () => {
  const data = new Map();
  const save = farmSave({ getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) });
  save.initialize(start);
  const { state: farm } = save.read(start);
  L.plant(farm, 6, "ca-chua", start);
  farm.stock["ca-rot"] = 1;
  assert.ok(save.write(farm, start + 5000));
  const { state: reopened } = save.read(start + 70_000);
  assert.equal(L.readyWhileAway(reopened, start + 70_000), 1);
  assert.equal(L.stage(reopened.plots[6], start + 70_000), "ready");
  assert.equal(reopened.coins, farm.coins);
  assert.equal(reopened.stock["ca-rot"], 1);
});

test("bỏ qua bản thử cũ và kẹp giá trị bản lưu mới bị hỏng", () => {
  const farm = L.newFarm(start);
  assert.equal(L.load({ ...farm, v: 1, coins: 999 }, start).coins, L.START_COINS);
  assert.equal(L.load("{", start).freeSeeds, 3);
  farm.stock["ca-rot"] = -9;
  farm.freeSeeds = 999;
  farm.plots[center].crop = "constructor";
  const loaded = L.load(farm, start);
  assert.equal(loaded.stock["ca-rot"], 0);
  assert.equal(loaded.freeSeeds, 3);
  assert.equal(loaded.plots[center].crop, null);
});
