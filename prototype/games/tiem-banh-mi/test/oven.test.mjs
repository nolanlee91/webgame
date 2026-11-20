// Lò, mẻ bánh, tủ kính, độ giòn, lò than (GAME-DESIGN §3.1, ECONOMY §3).
import test from "node:test";
import assert from "node:assert/strict";
import { shop, act, err, advance, openDay, untilWaiting } from "./helpers.mjs";
import { doneness, pullCrisp, toastResult } from "../core/oven.js";
import { OVENS, DISPLAY, TOASTER } from "../data/economy.js";

test("mức nướng lò mini: sống < 26 · chín 26–32 · xém 32–36 · cháy > 36", () => {
  const O = OVENS.mini;
  assert.equal(doneness(3, O), "raw");
  assert.equal(doneness(20, O), "pale");
  assert.equal(doneness(26, O), "golden");
  assert.equal(doneness(32, O), "golden");
  assert.equal(doneness(34, O), "dark");
  assert.equal(doneness(37, O), "burnt");
  assert.deepEqual([pullCrisp("golden"), pullCrisp("dark"), pullCrisp("pale"), pullCrisp("burnt")], [100, 90, 60, null]);
});

test("bỏ mẻ trừ 4 phôi + 1 gas; rút đúng vùng chín ⇒ 4 ổ giòn 100 vào tủ", () => {
  const s = shop(); act(s, { type: "startShift" });
  const phoi = s.stock.phoi, gas = s.stock.gas;
  act(s, { type: "bake", slot: 0 });
  assert.equal(s.stock.phoi, phoi - 4);
  assert.equal(s.stock.gas, gas - 1);
  assert.equal(err(s, { type: "bake", slot: 0 }), "slot-busy");
  const ev = advance(s, 28000);
  assert.ok(ev.some((e) => e.type === "batchGolden"), "báo chín một lần");
  act(s, { type: "pull", slot: 0 });
  assert.equal(s.shift.case.length, 4);
  assert.ok(s.shift.case.every((l) => l.crisp === 100));
  assert.equal(s.shift.stats.goldenPulls, 1);
});

test("rút sớm ⇒ bánh sống giòn 60; rút trễ ⇒ xém 90; quá trễ ⇒ cháy, bỏ cả mẻ (hao phôi + gas)", () => {
  const s = shop(); act(s, { type: "startShift" });
  act(s, { type: "bake", slot: 0 }); advance(s, 15000); act(s, { type: "pull", slot: 0 });
  assert.ok(s.shift.case.every((l) => l.crisp <= 60));
  s.shift.case = [];
  act(s, { type: "bake", slot: 0 }); advance(s, 34000); act(s, { type: "pull", slot: 0 });
  assert.ok(s.shift.case.every((l) => l.dark && l.crisp <= 90 && l.crisp > 85));
  s.shift.case = [];
  act(s, { type: "bake", slot: 0 }); const ev = advance(s, 40000);
  assert.ok(ev.some((e) => e.type === "batchBurnt"));
  act(s, { type: "pull", slot: 0 });
  assert.equal(s.shift.case.length, 0);
  assert.equal(s.shift.stats.burntBatches, 1);
  assert.ok(s.shift.waste.burnt >= 4 * 2 + 2, "hao phôi + gas");
});

test("hết gas khi bỏ mẻ ⇒ hội thoại cứu, không lỗi, có lựa chọn miễn phí", async () => {
  const s = shop(); act(s, { type: "startShift" });
  s.stock.gas = 0;
  act(s, { type: "bake", slot: 0 });
  assert.equal(s.shift.dialog.kind, "stockout");
  assert.equal(s.shift.dialog.id, "gas");
  const { stockoutOptions } = await import("../core/rescue.js");
  assert.ok(stockoutOptions(s).some((o) => o.free && o.ok && o.id !== "close"));
  act(s, { type: "stockout", choice: "gasBorrow" });
  advance(s, 10200);
  assert.ok(s.stock.gas >= 10);
});

test("tủ kính đầy thì không bỏ mẻ (khoá sức chứa 12)", () => {
  const s = shop(); act(s, { type: "startShift" });
  for (let i = 0; i < 12; i++) s.shift.case.push({ id: 900 + i, crisp: 100, src: "oven" });
  assert.equal(err(s, { type: "bake", slot: 0 }), "case-full");
});

test("mẻ đầu ngày: canh lò ngoài giờ ca, tối đa ngăn × 2 mẻ, bánh vào tủ lúc mở cửa", () => {
  const s = shop();
  act(s, { type: "firstBatch", sec: 28 });
  act(s, { type: "firstBatch", sec: 40 }); // cháy
  assert.equal(err(s, { type: "firstBatch", sec: 28 }), "prep-max");
  assert.equal(s.prep.loaves.length, 4);
  assert.equal(s.prep.burnt, 4);
  act(s, { type: "startShift" });
  assert.equal(s.shift.case.length, 4);
  assert.equal(s.shift.stats.batches, 2);
  assert.ok(s.shift.waste.burnt > 0);
});

test("bánh nguội dần: −1 giòn mỗi 2,5 s ca; 2 phút từ 100 xuống ~52", () => {
  const s = shop(); openDay(s);
  advance(s, DISPLAY.decayMs * 10);
  assert.ok(Math.abs(s.shift.case[0].crisp - 90) < 0.6, String(s.shift.case[0].crisp));
});

test("lò than: ≥ 4 s đưa giòn lên ≥ 85; lấy ra sớm chỉ nóng một phần; quá 10 s là cháy ổ", () => {
  assert.ok(toastResult({ crisp: 40 }, TOASTER.ms).crisp >= 85);
  assert.equal(toastResult({ crisp: 40 }, TOASTER.ms).toasted, true);
  const early = toastResult({ crisp: 40 }, 2000);
  assert.ok(early.crisp > 40 && early.crisp < 85 && !early.toasted);
  assert.equal(toastResult({ crisp: 40 }, TOASTER.burnMs + 1).burnt, true);
});

test("nướng lại trên thớt tốn 1 lần than, đang nướng thì không làm bước khác", () => {
  const s = shop(); openDay(s);
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id }); act(s, { type: "take" });
  const than = s.stock.than;
  s.shift.boards[0].loaf.crisp = 55;
  act(s, { type: "toast" });
  assert.equal(s.stock.than, than - 1);
  assert.equal(err(s, { type: "slice" }), "toasting");
  advance(s, 4200);
  act(s, { type: "toast" });
  assert.ok(s.shift.boards[0].loaf.crisp >= 85 && s.shift.boards[0].loaf.toasted);
});
