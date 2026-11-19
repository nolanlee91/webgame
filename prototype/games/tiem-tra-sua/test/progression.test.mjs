import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, MAX_LEVEL } from "../data/levels.js";
import { RECIPES, RECIPE } from "../data/recipes.js";
import { levelForXp, xpForServe, recipesAt, unlocksAt, xpProgress } from "../core/progression.js";
import { shop, act, untilWaiting, serveRight, advance, openDay } from "./helpers.mjs";

test("20 cấp, XP tích lũy tăng dần (đường cong M5 từ bộ mô phỏng, ECONOMY.md)", () => {
  assert.equal(LEVELS.length, MAX_LEVEL);
  for (let i = 1; i < LEVELS.length; i++) assert.ok(LEVELS[i].xp > LEVELS[i - 1].xp);
  assert.ok(LEVELS[1].xp >= 25 && LEVELS[1].xp <= 50);
  assert.ok(LEVELS[19].xp >= 10000, "cấp 20 là mục tiêu dài hạn (~11 giờ chơi)");
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(LEVELS[1].xp - 1), 1);
  assert.equal(levelForXp(LEVELS[1].xp), 2);
  assert.equal(levelForXp(99999), 20);
});

test("XP theo sao: 4–5 sao đủ, 3 sao 60%, 1–2 sao 25% (làm tròn xuống)", () => {
  const r = RECIPE["tra-sua-truyen-thong"];
  assert.deepEqual([5, 4, 3, 2, 1].map((s) => xpForServe(r, s)), [8, 8, 4, 2, 2]);
  assert.equal(xpForServe(RECIPE["matcha-pudding"], 3), 7);
});

test("8 công thức mở dần ở cấp 1, 1, 2, 3, 4, 6, 8, 10", () => {
  assert.deepEqual(RECIPES.map((r) => r.unlock), [1, 1, 2, 3, 4, 6, 8, 10]);
  assert.equal(recipesAt(1).length, 2);
  assert.equal(recipesAt(10).length, 8);
  assert.ok(unlocksAt(2).some((u) => u.kind === "recipe" && u.id === "o-long-thach"));
  assert.ok(unlocksAt(2).some((u) => u.kind === "stock" && u.id === "thach"));
});

test("giao ly lên cấp: phát sự kiện levelUp kèm mở khóa; thanh XP tính trong cấp", () => {
  const s = shop();
  s.xp = LEVELS[1].xp - 5; s.level = 1;
  act(s, { type: "startShift" });
  const c = untilWaiting(s);
  const r = serveRight(s, c);
  const up = r.events.find((e) => e.type === "levelUp");
  assert.ok(up, "có levelUp");
  assert.equal(up.level, 2);
  assert.equal(s.level, 2);
  assert.deepEqual(s.shift.levelUps, [2]);
  assert.deepEqual(xpProgress(s), { into: s.xp - LEVELS[1].xp, need: LEVELS[2].xp - LEVELS[1].xp });
});

test("danh tiếng: review 1–5 sao −3/−1/0/+1/+2, giới hạn ±8 mỗi ca", () => {
  const s = shop();
  act(s, { type: "startShift" });
  advance(s, 400000); // cả 5 khách ngày học bỏ về ⇒ 5 × −3 nhưng chỉ −8
  assert.equal(s.lastSummary.lost, 5);
  assert.equal(s.lastSummary.repDelta, -8);
  assert.equal(s.rep, 35 - 8);
});

test("ngày học xong ⇒ ngày 2 là ngày thường 6–10 khách, có giờ cao điểm", () => {
  const s = shop(11);
  act(s, { type: "startShift" });
  advance(s, 400000);
  assert.equal(s.day, 2);
  assert.ok(s.tutorialDone);
  openDay(s);
  assert.equal(s.shift.tutorial, false);
  assert.ok(s.shift.planned >= 6 && s.shift.planned <= 13, String(s.shift.planned)); // 6–10 + thưởng review / người theo dõi
  const ats = s.shift.schedule.map((g) => g.at);
  assert.ok(ats.some((t) => t >= 50000 && t <= 64000) || ats.some((t) => t >= 140000 && t <= 154000), "có khách trong đợt cao điểm");
  for (const g of s.shift.schedule) assert.ok(RECIPE[g.items[0].recipe].unlock <= s.level, "chỉ gọi món đã mở");
});
