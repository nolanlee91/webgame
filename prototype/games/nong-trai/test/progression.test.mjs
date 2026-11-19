import test from "node:test";
import assert from "node:assert/strict";
import * as G from "../core/progression.js?v=m2";
import { LEVELS, MAX_LEVEL, CURRENT_MILESTONE } from "../data/levels.js?v=m2";
import { CROPS } from "../data/crops.js?v=m2";
import { farm } from "./helpers.mjs";

test("đường XP giữ 10·lv^1,5", () => {
  assert.equal(G.xpNeed(1), 10);
  assert.equal(G.xpNeed(19), 828);
  for (let lv = 1; lv < 30; lv++) assert.equal(G.xpNeed(lv), Math.round(10 * lv ** 1.5));
});

test("bảng 20 cấp trong data; mỗi cây mở đúng cấp của bảng cây", () => {
  assert.equal(LEVELS.length, MAX_LEVEL);
  assert.deepEqual(LEVELS.map((l) => l.lv), Array.from({ length: 20 }, (_, k) => k + 1));
  for (const c of CROPS.filter((c) => !c.requires)) {
    const at = LEVELS.find((l) => l.unlocks.some((u) => u.kind === "crop" && u.id === c.id));
    assert.equal(at.lv, c.level, c.id);
  }
});

test("cộng XP lên nhiều cấp cùng lúc, mỗi cấp một sự kiện có danh sách mở khoá (chỉ món đã có ở bản này)", () => {
  const s = farm();
  const ev = [];
  G.addXp(s, 10 + 28 + 52, ev);
  assert.equal(s.level, 4);
  assert.deepEqual(ev.map((e) => e.level), [2, 3, 4]);
  assert.ok(ev[0].unlocks.includes("Dâu tây"));
  assert.ok(ev[1].unlocks.includes("Ngô") && ev[1].unlocks.includes("Ô đơn thứ 4"));
  assert.ok(ev[2].unlocks.includes("Xưởng + Bếp sên"), "Milestone 2: Xưởng được báo khi lên cấp 4");
  assert.ok(!G.unlocksAt(7).some((u) => u.name === "Chuồng gà"), "tính năng của milestone sau không được báo");
  for (const l of LEVELS) for (const u of G.unlocksAt(l.lv)) assert.ok(u.milestone <= CURRENT_MILESTONE);
});

test("tính năng mở theo cấp từ data/levels.js", () => {
  const s = farm();
  assert.equal(G.hasFeature(s, "plots"), false);
  s.level = 2;
  assert.equal(G.hasFeature(s, "plots"), true);
  assert.equal(G.hasFeature(s, "orders-combo"), false);
  s.level = 5;
  assert.equal(G.hasFeature(s, "orders-combo"), true);
  assert.equal(G.hasFeature(s, "orders-special"), false);
  s.level = 11;
  assert.equal(G.hasFeature(s, "orders-special"), true);
  assert.equal(G.nextUnlock(1).lv, 2);
});
