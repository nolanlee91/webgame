// Bếp topping (mẻ trân châu theo thời gian ca) + thiết bị / trang trí (Milestone 3).
import test from "node:test";
import assert from "node:assert/strict";
import { EQUIPMENT, BATCHES } from "../data/equipment.js";
import { appeal, kitchenSlots } from "../core/equipment.js";
import { loadSave, dump } from "../core/state.js";
import { shop, act, err, advance, untilWaiting, serveRight, types, openDay } from "./helpers.mjs";
import { LEVELS } from "../data/levels.js";

const day2 = (seed = 3) => { const s = shop(seed); s.tutorialDone = true; s.day = 2; return s; };

test("nấu mẻ 3 phần: trừ 3 trân châu sống, 18 giây ca sau có 3 phần sẵn", () => {
  const s = day2();
  act(s, { type: "startShift" });
  assert.equal(s.shift.kitchen.ready, 0);
  const raw = s.stock["tran-chau-song"];
  act(s, { type: "cook", size: 3 });
  assert.equal(s.stock["tran-chau-song"], raw - 3);
  assert.equal(err(s, { type: "cook", size: 3 }), "kitchen-busy", "bếp 1 ngăn");
  assert.equal(err(s, { type: "cook", size: 6 }), "locked");
  const ev = advance(s, BATCHES[3].ms - 400);
  assert.equal(s.shift.kitchen.ready, 0);
  const ev2 = advance(s, 600);
  assert.ok([...ev, ...ev2].some((e) => e.type === "batchDone"));
  assert.equal(s.shift.kitchen.ready, 3);
});

test("chưa nấu thì không thêm trân châu được; thạch lấy thẳng từ kho", () => {
  const s = day2();
  s.level = 2; s.xp = LEVELS[2 - 1].xp;
  s.stock.thach = 2; s.stock.da = 8;
  act(s, { type: "startShift" });
  for (const [step, id] of [["cup", "ly"], ["base", "hong-tra"], ["add", "sua"], ["sugar", 50], ["ice", "it"]]) act(s, { type: "brew", step, id });
  assert.equal(err(s, { type: "brew", step: "topping", id: "tran-chau" }), "not-cooked");
  act(s, { type: "brew", step: "topping", id: "thach" });
  assert.equal(s.stock.thach, 1);
});

test("mẻ 6 phần mở ở cấp 3; thiếu trân châu sống thì không nấu", () => {
  const s = day2();
  act(s, { type: "startShift" });
  assert.equal(err(s, { type: "cook", size: 6 }), "locked");
  assert.equal(err(s, { type: "cook", size: 4 }), "bad-size");
  s.stock["tran-chau-song"] = 2;
  // hết trân châu sống: không nấu được, mở hội thoại hết hàng (không kẹt)
  act(s, { type: "cook", size: 3 });
  assert.equal(s.shift.dialog?.kind, "stockout");
  assert.equal(s.shift.dialog.id, "tran-chau-song");
  assert.equal(s.stock["tran-chau-song"], 2);
});

test("cuối ca: trân châu nấu dư + mẻ đang nấu tính hao hụt một lần", () => {
  const s = day2();
  act(s, { type: "startShift" });
  act(s, { type: "cook", size: 3 });
  advance(s, 19000);
  act(s, { type: "cook", size: 3 });
  s.shift.schedule = []; s.shift.customers = [];
  advance(s, 200);
  assert.equal(s.lastSummary.pearlWaste, 6);
  assert.equal(s.lastSummary.waste, 12);
  assert.equal(s.carryPearls, 0);
});

test("mua thiết bị: chỉ khi đóng cửa, đủ cấp, đủ tiền, mỗi món một lần", () => {
  const s = shop();
  assert.equal(err(s, { type: "buy", id: "powered-sealer" }), "locked");
  assert.equal(err(s, { type: "buy", id: "khong-co" }), "unknown");
  const r = act(s, { type: "buy", id: "flowering-pot" });
  assert.ok(types(r).includes("bought"));
  assert.equal(s.money, 160 - EQUIPMENT["flowering-pot"].price);
  assert.equal(err(s, { type: "buy", id: "flowering-pot" }), "owned");
  act(s, { type: "startShift" });
  assert.equal(err(s, { type: "buy", id: "premium-lantern" }), "shift-open");
  s.shift = null; s.money = 10; s.level = 4; s.xp = LEVELS[4 - 1].xp;
  assert.equal(err(s, { type: "buy", id: "premium-lantern" }), "money");
});

test("kệ kho mở rộng: sức chứa 130; bếp 2 ngăn: nấu hai mẻ cùng lúc", () => {
  const s = shop();
  s.level = 7; s.xp = LEVELS[7 - 1].xp; s.money = 1000;
  act(s, { type: "buy", id: "crate-rack" });
  assert.equal(s.capacity, 130);
  act(s, { type: "buy", id: "dual-pot-cooker" });
  assert.equal(kitchenSlots(s), 2);
  s.tutorialDone = true;
  act(s, { type: "startShift" });
  act(s, { type: "cook", size: 3 });
  act(s, { type: "cook", size: 3 });
  assert.equal(s.shift.kitchen.batches.length, 2);
  assert.equal(err(s, { type: "cook", size: 3 }), "kitchen-busy");
});

test("tủ mát giữ trân châu dư sang ca sau", () => {
  const s = day2();
  s.level = 13; s.xp = LEVELS[13 - 1].xp; s.money = 1000;
  act(s, { type: "buy", id: "upright-fridge" });
  act(s, { type: "startShift" });
  act(s, { type: "cook", size: 3 });
  advance(s, 19000);
  s.shift.schedule = []; s.shift.customers = [];
  advance(s, 200);
  assert.equal(s.carryPearls, 3);
  assert.equal(s.lastSummary.pearlWaste, 0);
  openDay(s);
  assert.equal(s.shift.kitchen.ready, 3);
  assert.equal(s.carryPearls, 0);
});

test("trang trí cộng điểm hấp dẫn (trần 3): thêm khách và kiên nhẫn", () => {
  const a = day2(9), b = day2(9);
  b.level = 18; b.xp = LEVELS[18 - 1].xp; b.money = 2000;
  for (const id of ["flowering-pot", "premium-lantern", "tea-table-set", "lit-signboard"]) act(b, { type: "buy", id });
  assert.equal(appeal(b), 3);
  a.level = 18; a.xp = LEVELS[18 - 1].xp;
  b.money = a.money;
  openDay(a); openDay(b);
  assert.ok(b.shift.planned >= a.shift.planned, `${b.shift.planned} ≥ ${a.shift.planned}`);
  assert.ok(Math.abs(b.shift.patienceMult - 1.09) < 1e-9);
});

test("máy đóng nắp tốt: giao cùng lúc nhưng điểm thời gian cao hơn", () => {
  const run = (sealer) => {
    const s = shop(5);
    if (sealer) { s.level = 5; s.xp = LEVELS[5 - 1].xp; s.money = 500; act(s, { type: "buy", id: "powered-sealer" }); }
    act(s, { type: "startShift" });
    const c = untilWaiting(s);
    advance(s, Math.round(c.patience * 0.7));
    return serveRight(s, s.shift.customers.find((q) => q.id === c.id)).events.find((e) => e.type === "served").raw;
  };
  assert.ok(run(true) > run(false));
});

test("bếp đang nấu được lưu và tải lại đúng", () => {
  const s = day2();
  act(s, { type: "startShift" });
  act(s, { type: "cook", size: 3 });
  advance(s, 5000);
  const back = loadSave(dump(s));
  assert.deepEqual(back.shift.kitchen, s.shift.kitchen);
  advance(back, 13400);
  assert.equal(back.shift.kitchen.ready, 3);
});
