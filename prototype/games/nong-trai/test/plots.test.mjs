import test from "node:test";
import assert from "node:assert/strict";
import { apply } from "../core/apply.js?v=m14";
import * as P from "../core/plots.js?v=m14";
import { CROPS } from "../data/crops.js?v=m14";
import { START_COINS } from "../core/state.js?v=m14";
import { xpNeed } from "../core/progression.js?v=m14";
import { farm, act, err, START, CENTER } from "./helpers.mjs";

test("ruộng mới: 25 ô (+ 9 ô phía Đông + 9 ô Nhà kính đóng — Milestone 3), mở 9, xu khởi đầu, 3 hạt cà rốt tặng", () => {
  const s = farm();
  assert.equal(s.plots.length, 43);
  assert.equal(s.plots.slice(0, 25).filter((p) => !p.east && !p.gh).length, 25);
  assert.ok(s.plots.slice(25, 34).every((p) => p.east && !p.open) && s.plots.slice(34).every((p) => p.gh && !p.open));
  assert.equal(s.plots.filter((p) => p.open).length, 9);
  assert.equal(s.coins, START_COINS);
  assert.equal(s.freeSeeds, 3);
});

test("gieo: ưu tiên hạt tặng, rồi trừ xu", () => {
  const s = farm();
  for (const i of [6, 7, CENTER]) assert.equal(act(s, { type: "plant", i, crop: "ca-rot" }).result.cost, 0);
  assert.equal(s.coins, START_COINS);
  assert.equal(s.freeSeeds, 0);
  assert.equal(act(s, { type: "plant", i: 8, crop: "ca-chua" }).result.cost, 5);
  assert.equal(s.coins, START_COINS - 5);
});

test("gieo bị chặn: thiếu xu, ô bận, ô khoá, giống chưa mở, id lạ — trạng thái không đổi", () => {
  const s = farm();
  act(s, { type: "plant", i: CENTER, crop: "ca-rot" });
  s.coins = 0; s.freeSeeds = 0;
  const before = JSON.stringify(s);
  assert.equal(err(s, { type: "plant", i: 6, crop: "ca-chua" }), "coins");
  assert.equal(err(s, { type: "plant", i: CENTER, crop: "ca-chua" }), "busy");
  assert.equal(err(s, { type: "plant", i: 0, crop: "ca-rot" }), "locked");
  assert.equal(err(s, { type: "plant", i: 7, crop: "bi-ngo" }), "level");
  assert.equal(err(s, { type: "plant", i: 7, crop: "__proto__" }), "bad");
  assert.equal(err(s, { type: "plant", i: "7", crop: "ca-rot" }), "bad");
  assert.equal(err(s, { type: "plant", i: 99, crop: "ca-rot" }), "bad");
  assert.equal(JSON.stringify(s), before);
});

test("mía cần Nhà kính: đủ cấp vẫn khoá; lúa mở ở cấp 6", () => {
  const s = farm();
  s.level = 10;
  assert.equal(err(s, { type: "plant", i: 6, crop: "mia" }), "level");
  s.level = 5;
  assert.equal(err(s, { type: "plant", i: 6, crop: "lua" }), "level");
  s.level = 6; s.coins = 100;
  act(s, { type: "plant", i: 6, crop: "lua" });
  assert.equal(s.plots[6].crop, "lua");
});

test("mỗi giống qua 5 giai đoạn và chín đúng lúc", () => {
  for (const c of CROPS.filter((c) => !c.requires)) {
    const s = farm(); s.level = c.level; s.coins = 999;
    act(s, { type: "plant", i: CENTER, crop: c.id });
    const p = s.plots[CENTER];
    assert.deepEqual([0, .3, .6, .85, 1].map((k) => P.stage(p, START + c.growMs * k)), ["seed", "sprout", "grow", "mature", "ready"]);
    assert.equal(err(s, { type: "harvest", i: CENTER }, START + c.growMs - 1), "growing");
  }
});

test("tưới một lần rút 30% thời gian còn lại, tiến độ không tụt", () => {
  const s = farm();
  act(s, { type: "plant", i: CENTER, crop: "ca-rot" });
  const t = START + 10_000, before = P.progress(s.plots[CENTER], t);
  assert.equal(act(s, { type: "water", i: CENTER }, t).result.saved, 6000);
  assert.ok(P.progress(s.plots[CENTER], t) >= before);
  assert.equal(err(s, { type: "water", i: CENTER }, t), "watered");
  assert.equal(err(s, { type: "water", i: CENTER }, START + 24_000), "ready");
  assert.equal(err(s, { type: "water", i: 6 }, t), "empty");
});

test("thu hoạch vào kho, XP đúng một lần, không cộng xu", () => {
  const s = farm();
  act(s, { type: "plant", i: CENTER, crop: "ca-rot" });
  const coins = s.coins;
  assert.equal(act(s, { type: "harvest", i: CENTER }, START + 30_000).result.xp, 2);
  assert.equal(err(s, { type: "harvest", i: CENTER }, START + 30_000), "empty");
  assert.equal(s.inv["ca-rot"], 1);
  assert.equal(s.coins, coins);
  assert.equal(s.stats.harvested, 1);
});

test("thu hết chỉ lấy ô chín, lên cấp mở dâu tây", () => {
  const s = farm();
  s.xp = xpNeed(1) - 2; // cà rốt +2 XP ⇒ vừa đủ lên cấp 2
  act(s, { type: "plant", i: CENTER, crop: "ca-rot" });
  act(s, { type: "plant", i: 6, crop: "ca-chua" });
  const r = act(s, { type: "harvestAll" }, START + 30_000);
  assert.equal(r.result.count, 1);
  const up = r.events.find((e) => e.type === "levelUp");
  assert.equal(up.level, 2);
  assert.ok(up.unlocks.includes("Dâu tây"));
  assert.equal(s.plots[6].crop, "ca-chua");
  assert.equal(err(s, { type: "harvestAll" }, START + 30_000), "none-ready");
});

test("mở ô: từ cấp 2, chỉ ô kề, đủ xu; giá tăng 35%", () => {
  const s = farm();
  s.coins = 100;
  assert.equal(err(s, { type: "buyPlot", i: 2 }), "plots-level");
  s.level = 2;
  assert.equal(err(s, { type: "buyPlot", i: 0 }), "far");
  assert.equal(err(s, { type: "buyPlot", i: CENTER }), "open");
  assert.equal(act(s, { type: "buyPlot", i: 2 }).result.cost, 30);
  assert.ok(s.plots[2].open);
  assert.equal(P.plotCost(s), 40);
  s.coins = 39;
  assert.equal(err(s, { type: "buyPlot", i: 1 }), "coins");
  assert.equal(s.coins, 39);
});

test("trồng rồi tắt trang: cây chín theo timestamp, readyWhileAway đếm đúng", () => {
  const s = farm();
  act(s, { type: "plant", i: 6, crop: "ca-chua" });
  s.lastSeen = START + 5000;
  assert.equal(P.readyWhileAway(s, START + 70_000), 1);
  assert.equal(P.stage(s.plots[6], START + 70_000), "ready");
});
