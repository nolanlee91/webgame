import test from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../data/recipes.js";
import { STOCK, START_STOCK, START_CAPACITY } from "../data/ingredients.js";
import { recipeCost, recipeMargin, operatingProfit, stockUsed, packPrice, cupCost } from "../core/economy.js";
import { shop, act, err, untilWaiting, serveRight, advance } from "./helpers.mjs";

test("giá vốn 8 công thức khớp bảng ECONOMY (11/10/12/14/11/13/17/13)", () => {
  assert.deepEqual(RECIPES.map((r) => recipeCost(r.id)), [11, 10, 12, 14, 11, 13, 17, 13]);
  assert.deepEqual(RECIPES.map((r) => recipeMargin(r.id)), [16, 16, 20, 22, 20, 24, 26, 22]);
});

test("ví dụ lợi nhuận vận hành ECONOMY: 216 − 88 − 11 − 12 = 105", () => {
  assert.equal(operatingProfit({ revenue: 216, cogs: 88, waste: 11, fee: 12 }), 105);
});

test("tiệm mới: vốn 160k, kho 58/80 (gói học đủ 8 ly cơ bản), danh tiếng 35", () => {
  const s = shop();
  assert.equal(s.money, 160);
  assert.equal(stockUsed(s), Object.values(START_STOCK).reduce((a, b) => a + b, 0));
  assert.ok(stockUsed(s) <= START_CAPACITY);
  assert.equal(s.rep, 35);
  for (const id of ["ly", "hong-tra", "sua", "duong", "da", "tran-chau-song"]) assert.ok(s.stock[id] >= 8, id);
});

test("mở ca trừ phí 12k một lần; mở lần hai bị chặn", () => {
  const s = shop();
  act(s, { type: "startShift" });
  assert.equal(s.money, 148);
  assert.equal(err(s, { type: "startShift" }), "shift-open");
  assert.equal(s.money, 148);
});

test("giao đúng: +giá bán vào tiền, giá vốn ghi sổ, kho trừ đúng phần", () => {
  const s = shop();
  act(s, { type: "startShift" });
  const c = untilWaiting(s);
  const before = { ...s.stock };
  serveRight(s, c);
  assert.equal(s.money, 148 + 27);
  assert.equal(s.shift.ledger.revenue, 27);
  assert.equal(s.shift.ledger.cogs, 11);
  for (const id of ["ly", "hong-tra", "sua", "duong", "da"]) assert.equal(s.stock[id], before[id] - 1, id);
  assert.equal(s.stock["tran-chau-song"], before["tran-chau-song"], "trân châu lấy từ mẻ đã nấu, không từ kho sống");
  assert.equal(s.shift.kitchen.ready, 2, "ngày học có sẵn mẻ 3 phần, dùng 1");
});

test("hoàn tác và đổ bỏ ghi hao hụt theo phần đã đổ (không hoàn kho)", () => {
  const s = shop();
  act(s, { type: "startShift" });
  untilWaiting(s);
  act(s, { type: "brew", step: "cup", id: "ly" });
  act(s, { type: "brew", step: "base", id: "hong-tra" });
  act(s, { type: "brew", step: "add", id: "sua" });
  act(s, { type: "undo" });
  assert.equal(s.shift.ledger.waste, 3);
  assert.equal(s.stock.sua, 7);
  assert.equal(cupCost(s.shift.stations[s.shift.sel].cup), 4);
  act(s, { type: "discard" });
  assert.equal(s.shift.ledger.waste, 7);
  assert.equal(s.shift.stations[s.shift.sel].cup, null);
});

test("nhập hàng: trừ tiền theo gói, kiểm khóa cấp / tiền / sức chứa; giữa ca giá gấp +15%", () => {
  const s = shop();
  assert.equal(err(s, { type: "restock", id: "matcha" }), "locked");
  s.stock.thach = 20; // 78/80, gói đào 4 phần
  assert.equal(err(s, { type: "restock", id: "dao" }), "capacity");
  s.stock.thach = 0; s.stock.da = 0; // còn chỗ 32
  act(s, { type: "restock", id: "dao" });
  assert.equal(s.money, 160 - STOCK.dao.cost * STOCK.dao.pack);
  assert.equal(s.stock.dao, 8);
  s.money = 3;
  assert.equal(err(s, { type: "restock", id: "duong" }), "money");
  s.money = 100;
  act(s, { type: "startShift" });
  const m = s.money;
  act(s, { type: "restock", id: "hong-tra" });
  assert.equal(packPrice("hong-tra", true), Math.ceil(12 * 1.15));
  assert.equal(s.money, m - 14);
  assert.equal(s.shift.ledger.restock, 14);
});

test("không bao giờ âm tiền: hụt vốn thì phí ca chỉ trừ phần đang có", () => {
  const s = shop();
  s.money = 5;
  act(s, { type: "startShift" });
  assert.equal(s.money, 0);
  assert.equal(s.shift.ledger.fee, 5);
});

test("chốt ca: lợi nhuận = doanh thu − giá vốn − hao hụt − phí", () => {
  const s = shop();
  act(s, { type: "startShift" });
  const c = untilWaiting(s);
  serveRight(s, c);
  act(s, { type: "brew", step: "cup", id: "ly" }); // ly dở, cuối ca bỏ ⇒ hao 2k
  advance(s, 400000);
  assert.equal(s.shift, null);
  const S = s.lastSummary;
  assert.equal(S.revenue, 27);
  assert.equal(S.cogs, 11);
  assert.equal(S.pearlWaste, 2, "mẻ học 3 phần, dùng 1, dư 2 phần bỏ cuối ca");
  assert.equal(S.waste, 2 + 2 * 2);
  assert.equal(S.profit, 27 - 11 - 6 - 12);
});
