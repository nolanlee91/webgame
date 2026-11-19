// Milestone 3 (phần còn lại): đơn nhiều ly, bàn pha đôi / ba (pha song song), nhiệm vụ ngày, nhà cung cấp thứ hai, quảng bá,
// gói ký gửi khi hụt vốn (không bao giờ kẹt), kéo-thả trang trí.
import test from "node:test";
import assert from "node:assert/strict";
import { RECIPE } from "../data/recipes.js";
import { EQUIPMENT } from "../data/equipment.js";
import { STOCK_IDS } from "../data/ingredients.js";
import { cupsLeft, curCup, activeCid } from "../core/shift.js";
import { stationCount } from "../core/equipment.js";
import { needsBailout, canMakeBasic, consignAvailable, CONSIGN_KIT, PROMOS } from "../core/business.js";
import { packPrice, packSize, costOfUse, stockUsed, capacity } from "../core/economy.js";
import { placeError } from "../core/decor.js";
import { MISSION } from "../data/missions.js";
import { loadSave, dump } from "../core/state.js";
import { shop, act, err, advance, untilWaiting, stepsFor, clearDrama } from "./helpers.mjs";

/** Ca ngày thường, không sự kiện chen ngang, lịch khách do test đặt. */
function day(level = 9, guests = [], seed = 3) {
  const s = shop(seed);
  s.tutorialDone = true; s.day = 5; s.money = 3000;
  s.xp = [0, 0, 30, 75, 130, 195, 270, 355, 450, 555, 670, 795, 930, 1075, 1230, 1395, 1570, 1755, 1950, 2155, 2370][level]; s.level = level;
  for (const id of STOCK_IDS) s.stock[id] = 6;
  return Object.assign(s, { _guests: guests });
}
function open(s) {
  act(s, { type: "startShift" });
  s.shift.drama.max = 0;
  s.shift.schedule = s._guests.map((g, i) => ({ at: 10 + i * 50, arch: g.arch || "van-phong", name: g.name || "Khách " + i, items: g.items }));
  s.shift.kitchen.ready = 6;
  advance(s, 2800);
  return s;
}
const brewSteps = (s, o) => { for (const [step, id] of stepsFor(o)) act(s, { type: "brew", step, id }); };
const twoDao = [{ recipe: "tra-dao", sugar: 50, ice: "vua" }, { recipe: "tra-dao", sugar: 50, ice: "vua" }];

test("đơn hai ly: ghép từng ly vào đơn, khách chỉ trả tiền khi đủ ly, giá và XP cộng cả đơn", () => {
  const s = open(day(3, [{ items: twoDao }]));
  const c = s.shift.customers[0];
  assert.equal(c.items.length, 2);
  assert.equal(c.price, 2 * RECIPE["tra-dao"].price);
  assert.ok(c.patience > 48000 * 1.5, "kiên nhẫn dài hơn cho đơn nhiều ly");
  act(s, { type: "pin", cid: c.id });
  const m0 = s.money;
  brewSteps(s, c.items[0].order);
  const r1 = act(s, { type: "serve", cid: c.id });
  assert.ok(r1.events.some((e) => e.type === "filled" && e.n === 1 && e.of === 2));
  assert.equal(s.money, m0, "chưa thu tiền khi mới đủ 1/2");
  assert.equal(cupsLeft(s.shift.customers[0]), 1);
  assert.equal(activeCid(s.shift), c.id, "chỗ pha vẫn ghim đơn để pha ly 2");
  brewSteps(s, c.items[1].order);
  const r2 = act(s, { type: "serve", cid: c.id });
  const sv = r2.events.find((e) => e.type === "served");
  assert.equal(sv.cups, 2);
  assert.equal(s.money, m0 + c.price);
  assert.equal(s.shift.ledger.cups, 2);
  assert.equal(s.shift.ledger.multi, 1);
  assert.ok(sv.xp >= 2 * RECIPE["tra-dao"].xp);
  assert.equal(err(s, { type: "serve", cid: c.id }), "not-waiting", "giao lặp bị chặn");
});

test("đơn nhiều ly có một ly sai món nền ⇒ khiếu nại; làm lại chỉ làm lại ly sai", () => {
  const s = open(day(3, [{ items: [{ recipe: "tra-dao", sugar: 50, ice: "vua" }, { recipe: "tra-sua-truyen-thong", sugar: 50, ice: "it" }] }]));
  const c = s.shift.customers[0];
  act(s, { type: "pin", cid: c.id });
  brewSteps(s, c.items[0].order);
  act(s, { type: "serve", cid: c.id });
  brewSteps(s, { ...c.items[1].order, add: "dao" }); // ly 2 sai phần thêm
  const r = act(s, { type: "serve", cid: c.id });
  assert.ok(r.result.complaint);
  assert.deepEqual(s.shift.dialog.wrong, [1]);
  act(s, { type: "resolve", choice: "remake" });
  const k = s.shift.customers[0];
  assert.ok(k.filled[0] && !k.filled[1], "giữ ly đúng, bỏ ly sai");
  brewSteps(s, k.items[1].order);
  const r2 = act(s, { type: "serve", cid: c.id });
  assert.equal(r2.events.find((e) => e.type === "served").stars <= 4, true);
});

test("ly ghép vào ly còn thiếu hợp nhất trong đơn (dù pha khác thứ tự)", () => {
  const s = open(day(3, [{ items: [{ recipe: "tra-dao", sugar: 50, ice: "vua" }, { recipe: "tra-sua-truyen-thong", sugar: 50, ice: "it" }] }]));
  const c = s.shift.customers[0];
  act(s, { type: "pin", cid: c.id });
  brewSteps(s, c.items[1].order); // pha ly 2 trước
  act(s, { type: "serve", cid: c.id });
  const k = s.shift.customers[0];
  assert.ok(k.filled[1] && !k.filled[0]);
});

test("cấp 3 / ngày 3 mới có đơn hai ly; ba ly từ cấp 10 vào giờ cao điểm", () => {
  const count = (level, dayN) => {
    let multi = 0, three = 0;
    for (let seed = 1; seed <= 25; seed++) {
      const s = shop(seed); s.tutorialDone = true; s.day = dayN;
      s.xp = [0, 0, 30, 75, 130, 195, 270, 355, 450, 555, 670][level]; s.level = level;
      act(s, { type: "startShift" });
      for (const g of s.shift.schedule) { if (g.items.length > 1) multi++; if (g.items.length === 3) three++; }
    }
    return { multi, three };
  };
  assert.equal(count(1, 2).multi, 0);
  assert.ok(count(3, 2).multi > 0);
  assert.equal(count(3, 2).three, 0);
  assert.ok(count(10, 6).three > 0);
});

test("bàn pha đôi: 2 chỗ pha, ghim đơn hai ly ⇒ cả hai chỗ nhận đơn, mỗi bước rót cả hai ly cùng yêu cầu", () => {
  const s = day(9, [{ items: twoDao }]);
  act(s, { type: "buy", id: "double-station" });
  assert.equal(stationCount(s), 2);
  open(s);
  assert.equal(s.shift.stations.length, 2);
  const c = s.shift.customers[0];
  act(s, { type: "pin", cid: c.id });
  assert.deepEqual(s.shift.stations.map((st) => [st.cid, st.item]), [[c.id, 0], [c.id, 1]]);
  const ly = s.stock.ly;
  let clicks = 0;
  for (const [step, id] of stepsFor(c.items[0].order)) { const r = act(s, { type: "brew", step, id }); clicks++; assert.deepEqual(r.events[0].also, [1]); }
  assert.equal(clicks, 7, "7 lần bấm cho 2 ly");
  assert.equal(s.stock.ly, ly - 2);
  assert.ok(s.shift.stations.every((st) => st.cup?.sealed));
  act(s, { type: "serve", cid: c.id });
  act(s, { type: "select", station: 1 });
  const r = act(s, { type: "serve", cid: c.id });
  assert.equal(r.events.find((e) => e.type === "served").cups, 2);
});

test("bàn pha đôi: pha song song hai khách, đổi chỗ pha giữ nguyên ly dở; ly khác yêu cầu không bị rót nhầm", () => {
  const s = day(9, [{ items: [{ recipe: "tra-dao", sugar: 50, ice: "vua" }] }, { items: [{ recipe: "tra-dao", sugar: 70, ice: "nhieu" }] }]);
  act(s, { type: "buy", id: "double-station" });
  open(s);
  const [a, b] = s.shift.customers;
  act(s, { type: "pin", cid: a.id });
  act(s, { type: "brew", step: "cup", id: "ly" });
  act(s, { type: "pin", cid: b.id });
  assert.equal(s.shift.sel, 1, "khách thứ hai sang chỗ pha trống");
  assert.equal(s.shift.stations[0].cup.steps.length, 1, "ly dở ở chỗ 1 vẫn giữ");
  for (const [step, id] of stepsFor(b.order).slice(0, 4)) act(s, { type: "brew", step, id }); // ly → trà → đào → 70%
  // ly của A đang chờ bước trà: trà + đào giống phiếu A nên được rót cùng, 70% đường khác phiếu A (50%) nên không
  assert.deepEqual(s.shift.stations[0].cup.steps.map((x) => x.id), ["ly", "hong-tra", "dao"]);
  act(s, { type: "select", station: 0 });
  for (const [step, id] of stepsFor(a.order).slice(3)) act(s, { type: "brew", step, id });
  act(s, { type: "serve", cid: a.id });
  act(s, { type: "select", station: 1 });
  for (const [step, id] of stepsFor(b.order).slice(4)) act(s, { type: "brew", step, id });
  act(s, { type: "serve", cid: b.id });
  assert.equal(s.shift.ledger.served, 2);
});

test("bàn pha ba chỗ cần bàn pha đôi; lưu giữa ca giữ ly ở từng chỗ pha", () => {
  const s = day(17, [{ items: [...twoDao, { recipe: "tra-dao", sugar: 50, ice: "vua" }] }]);
  assert.equal(err(s, { type: "buy", id: "triple-station" }), "requires");
  act(s, { type: "buy", id: "double-station" });
  act(s, { type: "buy", id: "triple-station" });
  assert.equal(stationCount(s), 3);
  open(s);
  const c = s.shift.customers[0];
  act(s, { type: "pin", cid: c.id });
  act(s, { type: "brew", step: "cup", id: "ly" });
  act(s, { type: "brew", step: "base", id: "hong-tra" });
  const back = loadSave(dump(s));
  assert.deepEqual(back.shift.stations, s.shift.stations);
  assert.equal(back.shift.stations.filter((st) => st.cup?.steps.length === 2).length, 3);
});

test("nhiệm vụ ngày: mở ở cấp 2, 3 mục mỗi ca, đếm khi giao, thưởng trả đúng một lần", () => {
  const one = [{ arch: "hoc-sinh", items: [{ recipe: "tra-dao", sugar: 50, ice: "vua" }] }];
  const lo = open(day(1, one));
  assert.equal(lo.shift.missions.length, 0);
  const s = open(day(2, Array.from({ length: 3 }, () => ({ arch: "hoc-sinh", items: [{ recipe: "tra-dao", sugar: 50, ice: "vua" }] }))));
  assert.equal(s.shift.missions.length, 3);
  assert.equal(new Set(s.shift.missions.map((m) => m.id)).size, 3);
  s.shift.missions = [{ id: "sugar-exact", text: "x", n: 2, prog: 0, done: false, reward: { ...MISSION["sugar-exact"].reward } }];
  const xp0 = s.xp;
  for (const c of s.shift.customers.slice(0, 2)) { act(s, { type: "pin", cid: c.id }); brewSteps(s, c.order); act(s, { type: "serve", cid: c.id }); }
  assert.equal(s.shift.missions[0].done, true);
  const gained = s.xp - xp0;
  const c3 = s.shift.customers.find((q) => q.phase === "wait");
  act(s, { type: "pin", cid: c3.id }); brewSteps(s, c3.order);
  const r = act(s, { type: "serve", cid: c3.id });
  assert.equal(r.events.some((e) => e.type === "missionDone"), false, "không thưởng lần hai");
  assert.ok(gained >= MISSION["sugar-exact"].reward.xp);
});

test("nhiệm vụ chốt ca: không ai bỏ về được xét lúc chốt ca", () => {
  const s = open(day(2, Array.from({ length: 4 }, () => ({ arch: "hoc-sinh", items: [{ recipe: "tra-dao", sugar: 50, ice: "vua" }] }))));
  s.shift.missions = [{ id: "no-lost", text: "x", n: 4, prog: 0, done: false, reward: { ...MISSION["no-lost"].reward } }];
  for (let i = 0; i < 4; i++) { const c = untilWaiting(s); act(s, { type: "pin", cid: c.id }); brewSteps(s, c.order); act(s, { type: "serve", cid: c.id }); }
  const m = s.money;
  advance(s, 400000);
  clearDrama(s);
  assert.equal(s.lastSummary.missions[0].done, true);
  assert.ok(s.money >= m + MISSION["no-lost"].reward.money);
});

test("nhà cung cấp thứ hai (cấp 12): gói gấp đôi rẻ hơn 10%, không nhận giữa ca", () => {
  const s = day(12, [{ items: [{ recipe: "tra-dao", sugar: 50, ice: "vua" }] }]);
  for (const id of STOCK_IDS) s.stock[id] = 0;
  assert.equal(err(day(11), { type: "restock", id: "sua", supplier: "si" }), "locked");
  const m = s.money;
  act(s, { type: "restock", id: "sua", supplier: "si" });
  assert.equal(s.stock.sua, packSize("sua", "si"));
  assert.equal(packSize("sua", "si"), 12);
  assert.ok(packPrice("sua", false, "si") < 2 * packPrice("sua"));
  assert.equal(s.money, m - packPrice("sua", false, "si"));
  open(s);
  assert.equal(err(s, { type: "restock", id: "sua", supplier: "si" }), "supplier-closed");
  act(s, { type: "restock", id: "sua" }); // Dì Ba giao gấp vẫn được
});

test("quảng bá (cấp 14): một lần mỗi ngày, trừ tiền, thêm khách ca đó", () => {
  assert.equal(err(day(13), { type: "promo", kind: "to-roi" }), "locked");
  const a = day(14, [], 8), b = day(14, [], 8);
  act(b, { type: "promo", kind: "check-in" });
  assert.equal(b.money, a.money - PROMOS["check-in"].price);
  assert.equal(err(b, { type: "promo", kind: "to-roi" }), "once-per-day");
  act(a, { type: "startShift" }); act(b, { type: "startShift" });
  assert.ok(b.shift.planned > a.shift.planned, `${b.shift.planned} > ${a.shift.planned}`);
});

test("hụt vốn không bao giờ kẹt: hết tiền + hết hàng ⇒ nhận gói ký gửi, mở ca, bán được, tự trừ nợ bằng giá vốn", () => {
  const s = day(1);
  s.money = 0;
  for (const id of STOCK_IDS) s.stock[id] = 0;
  assert.equal(canMakeBasic(s), false);
  assert.equal(needsBailout(s), true);
  assert.equal(consignAvailable(s), true);
  act(s, { type: "consign" });
  assert.equal(err(s, { type: "consign" }), "not-needed", "đã đủ hàng thì không cần nữa");
  assert.equal(s.consign.owed, costOfUse(CONSIGN_KIT));
  assert.ok(canMakeBasic(s));
  act(s, { type: "startShift" });
  s.shift.drama.max = 0;
  s.shift.schedule = [{ at: 10, arch: "hoc-sinh", name: "Tí", items: [{ recipe: "tra-dao", sugar: 50, ice: "vua" }] }];
  advance(s, 2800);
  const c = s.shift.customers[0];
  act(s, { type: "pin", cid: c.id }); brewSteps(s, c.order);
  const owed = s.consign.owed;
  const r = act(s, { type: "serve", cid: c.id });
  const sv = r.events.find((e) => e.type === "served");
  assert.ok(sv.repay > 0 && sv.repay <= owed);
  assert.equal(s.money, c.price - sv.repay);
  assert.equal(s.consign.owed, owed - sv.repay);
  assert.ok(s.money > 0, "có tiền lại sau ly đầu");
});

test("gói ký gửi một lần mỗi ngày", () => {
  const s = day(1);
  s.money = 0;
  for (const id of STOCK_IDS) s.stock[id] = 0;
  act(s, { type: "consign" });
  for (const id of STOCK_IDS) s.stock[id] = 0;
  assert.equal(err(s, { type: "consign" }), "once-per-day");
  s.day++;
  act(s, { type: "consign" });
});

test("kéo-thả trang trí: đặt được trên sàn trống, chặn chỗ khách đứng, lối vào và tường; lưu lại vị trí", () => {
  const s = day(4);
  act(s, { type: "buy", id: "flowering-pot" });
  act(s, { type: "buy", id: "premium-lantern" });
  assert.equal(err(s, { type: "place", id: "flowering-pot", x: 790, y: 505 }), "place-spot");
  assert.equal(err(s, { type: "place", id: "flowering-pot", x: 1090, y: 488 }), "place-path");
  assert.equal(err(s, { type: "place", id: "flowering-pot", x: 400, y: 200 }), "place-zone");
  assert.equal(err(s, { type: "place", id: "premium-lantern", x: 900, y: 600 }), "place-zone", "đèn treo tường");
  assert.equal(err(s, { type: "place", id: "tea-table-set", x: 1100, y: 680 }), "not-owned");
  act(s, { type: "place", id: "flowering-pot", x: 1200, y: 690 });
  assert.deepEqual(loadSave(dump(s)).placement, { "flowering-pot": [1200, 690] });
  act(s, { type: "resetPlace", id: "flowering-pot" });
  assert.deepEqual(s.placement, {});
  for (const [id, it] of Object.entries(EQUIPMENT)) if (it.place) assert.equal(placeError(id, ...it.at), null, id + ": vị trí mặc định hợp lệ");
});

test("ghế chờ (shop-fixtures) tăng kiên nhẫn 8%", () => {
  const a = day(3), b = day(3);
  act(b, { type: "buy", id: "waiting-bench" });
  act(a, { type: "startShift" }); act(b, { type: "startShift" });
  assert.ok(Math.abs(b.shift.patienceMult - a.shift.patienceMult - 0.08) < 1e-9);
});

test("kho đầy hàng khác vẫn nhận được gói ký gửi (Dì Ba để dưới gầm quầy) ⇒ không kẹt; nhập thường vẫn bị chặn", () => {
  const s = day(1);
  s.money = 0;
  for (const id of STOCK_IDS) s.stock[id] = 0;
  s.stock.thach = 58;
  act(s, { type: "consign" });
  assert.ok(s.stock.ly >= 6 && s.stock.duong >= 6, "đủ món cơ bản");
  assert.ok(stockUsed(s) > capacity(s));
  s.money = 100;
  assert.equal(err(s, { type: "restock", id: "ly" }), "capacity");
});
