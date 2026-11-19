// Kiểm đơn: chấm điểm ly giao, thứ tự bước, khóa / hết hàng, sai món nền ⇒ khiếu nại, giao đúng một lần.
import test from "node:test";
import assert from "node:assert/strict";
import { scoreServe, starsFor } from "../core/score.js";
import { cupLayers } from "../core/cupview.js";
import { RECIPE } from "../data/recipes.js";
import { shop, act, err, types, untilWaiting, serveRight, brewFor, stepsFor } from "./helpers.mjs";

const TS = { base: "hong-tra", add: "sua", sugar: 50, ice: "it", topping: "tran-chau" };
const cupOf = (o, sealed = true) => ({ steps: stepsFor(o).filter(([st]) => sealed || st !== "lid").map(([step, id]) => ({ step, id })), sealed });

test("ly đúng, giao sớm: 100 điểm, 5 sao", () => {
  const r = scoreServe(TS, cupOf(TS), 0.2, "topping");
  assert.equal(r.raw, 100);
  assert.equal(r.stars, 5);
  assert.deepEqual(r.errors, []);
});

test("mốc sao 0/40/55/70/85", () => {
  assert.deepEqual([0, 39, 40, 54, 55, 69, 70, 84, 85, 100].map(starsFor), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
});

test("đường lệch một mức −5, lệch xa −10; ghi đúng chiều ngọt hơn / nhạt hơn", () => {
  const a = scoreServe(TS, cupOf({ ...TS, sugar: 70 }), 0.2, "base");
  assert.equal(a.recipe, 55);
  assert.ok(a.errors.includes("sugarHigh"));
  const b = scoreServe(TS, cupOf({ ...TS, sugar: 0 }), 0.2, "base");
  assert.equal(b.recipe, 50);
  assert.ok(b.errors.includes("sugarLow"));
});

test("đá và topping: thiếu topping −10, topping thừa −5, sai topping −10", () => {
  assert.ok(scoreServe(TS, cupOf({ ...TS, ice: "nhieu" }), 0.2, "base").errors.includes("iceHigh"));
  const miss = scoreServe(TS, cupOf({ ...TS, topping: "none" }), 0.2, "base");
  assert.equal(miss.recipe, 50); assert.ok(miss.errors.includes("toppingMissing"));
  const extra = scoreServe({ ...TS, topping: "none" }, cupOf(TS), 0.2, "base");
  assert.equal(extra.recipe, 55); assert.ok(extra.errors.includes("toppingExtra"));
  const wrong = scoreServe(TS, cupOf({ ...TS, topping: "thach" }), 0.2, "base");
  assert.ok(wrong.errors.includes("toppingWrong"));
});

test("thời gian: đủ 25 điểm trước nửa kiên nhẫn, giảm dần còn 5 khi sát hạn", () => {
  assert.equal(scoreServe(TS, cupOf(TS), 0.5, "base").time, 25);
  assert.equal(scoreServe(TS, cupOf(TS), 0.75, "base").time, 15);
  assert.equal(scoreServe(TS, cupOf(TS), 1, "base").time, 5);
});

test("sai món nền (trà hoặc phần thêm) ⇒ tối đa 2 sao", () => {
  const r = scoreServe(TS, cupOf({ ...TS, add: "dao" }), 0.1, "base");
  assert.ok(r.wrongBase);
  assert.ok(r.stars <= 2);
  assert.ok(scoreServe(TS, cupOf({ ...TS, base: "o-long" }), 0.1, "base").stars <= 2);
});

test("ly đổi hình ở MỖI bước của Trà sữa truyền thống (7 trạng thái khác nhau)", () => {
  const stages = [];
  for (let i = 1; i <= 7; i++) stages.push(cupLayers(cupOf(TS).steps.length && { steps: cupOf(TS).steps.slice(0, i), sealed: i === 7 }).stage);
  assert.equal(new Set(stages).size, 7, stages.join(" | "));
  assert.deepEqual(cupLayers(cupOf(TS)).layers, ["milk-75", "pearls-bottom", "ice-top", "empty-cup", "dome-lid"]);
  assert.equal(cupLayers({ steps: [{ step: "cup", id: "ly" }, { step: "base", id: "hong-tra" }], sealed: false }).layers[0], "amber-50");
});

test("phải pha đúng thứ tự; không thêm gì sau khi đóng nắp", () => {
  const s = shop();
  act(s, { type: "startShift" });
  untilWaiting(s);
  assert.equal(err(s, { type: "brew", step: "base", id: "hong-tra" }), "wrong-step");
  act(s, { type: "brew", step: "cup", id: "ly" });
  assert.equal(err(s, { type: "brew", step: "sugar", id: 50 }), "wrong-step");
  assert.equal(err(s, { type: "brew", step: "base", id: "khong-co" }), "bad-choice");
  assert.equal(err(s, { type: "brew", step: "base", id: "matcha" }), "locked");
  for (const [step, id] of stepsFor(TS).slice(1)) act(s, { type: "brew", step, id });
  assert.equal(err(s, { type: "brew", step: "lid", id: "dong-nap" }), "sealed");
  assert.equal(err(s, { type: "undo" }), "sealed");
});

test("hết hàng thì không rót được (kho không âm)", () => {
  const s = shop();
  act(s, { type: "startShift" });
  untilWaiting(s);
  s.stock.ly = 0;
  assert.equal(err(s, { type: "brew", step: "cup", id: "ly" }), "out-of-stock");
  assert.equal(s.stock.ly, 0);
});

test("giao chỉ khi ly đã đóng nắp và khách còn đang chờ; bấm giao lặp không cộng hai lần", () => {
  const s = shop();
  act(s, { type: "startShift" });
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id });
  assert.equal(err(s, { type: "serve", cid: c.id }), "not-sealed");
  brewFor(s, c);
  const r = act(s, { type: "serve", cid: c.id });
  assert.deepEqual(types(r).filter((t) => t === "served"), ["served"]);
  const money = s.money, cups = s.shift.ledger.cups;
  assert.equal(err(s, { type: "serve", cid: c.id }), "not-waiting");
  assert.equal(s.money, money);
  assert.equal(s.shift.ledger.cups, cups);
});

test("sai món nền ⇒ khiếu nại (ca dừng, chưa thu tiền) → Làm lại: hao hụt, khách chờ thêm, giao đúng tối đa 4 sao", () => {
  const s = shop();
  act(s, { type: "startShift" });
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id });
  brewFor(s, c, { add: "dao" });
  const money = s.money;
  const r = act(s, { type: "serve", cid: c.id });
  assert.ok(types(r).includes("complaint"));
  assert.equal(s.money, money);
  assert.equal(s.shift.dialog.kind, "complaint");
  const t = s.shift.t;
  act(s, { type: "tick", dt: 500 });
  assert.equal(s.shift.t, t, "đồng hồ ca dừng khi hội thoại mở");
  assert.equal(err(s, { type: "brew", step: "cup", id: "ly" }), "dialog");
  act(s, { type: "resolve", choice: "remake" });
  assert.equal(s.shift.dialog, null);
  assert.equal(s.shift.ledger.waste, 12); // ly có đào thay sữa: 2+2+4+1+1+2
  assert.equal(s.shift.ledger.remakes, 1);
  assert.equal(s.shift.stations[s.shift.sel].cid, c.id);
  brewFor(s, c);
  const r2 = act(s, { type: "serve", cid: c.id });
  const served = r2.events.find((e) => e.type === "served");
  assert.equal(served.stars, 4);
  assert.equal(err(s, { type: "resolve", choice: "remake" }), "no-dialog");
});

test("khiếu nại → giảm nửa giá: thu nửa tiền, tối đa 2 sao; → không lấy tiền: 0 doanh thu, review 2 sao", () => {
  const s = shop();
  act(s, { type: "startShift" });
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id }); brewFor(s, c, { base: "hong-tra", add: "dao" });
  act(s, { type: "serve", cid: c.id });
  const m = s.money;
  act(s, { type: "resolve", choice: "discount" });
  assert.equal(s.money, m + Math.floor(RECIPE[c.recipe].price / 2));
  assert.ok(s.shift.reviews.at(-1).stars <= 2);
  const s2 = shop();
  act(s2, { type: "startShift" });
  const d = untilWaiting(s2);
  act(s2, { type: "pin", cid: d.id }); brewFor(s2, d, { add: "dao" });
  act(s2, { type: "serve", cid: d.id });
  const m2 = s2.money;
  act(s2, { type: "resolve", choice: "refund" });
  assert.equal(s2.money, m2);
  assert.equal(s2.shift.ledger.revenue, 0);
  assert.equal(s2.shift.ledger.refunds, 1);
  assert.equal(s2.shift.reviews.at(-1).stars, 2);
  assert.equal(s2.shift.reviews.at(-1).reason, "refund");
});

test("ghim phiếu chỉ với khách đang chờ", () => {
  const s = shop();
  act(s, { type: "startShift" });
  assert.equal(err(s, { type: "pin", cid: 99 }), "not-waiting");
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id });
  assert.equal(s.shift.stations[s.shift.sel].cid, c.id);
  serveRight(s, s.shift.customers.find((q) => q.id === c.id) ? c : c);
});
