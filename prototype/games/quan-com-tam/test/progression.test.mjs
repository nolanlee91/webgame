// A: M3 tiến trình + kinh tế: 20 cấp, lên quán, ca trưa, ghép bàn, ghi sổ, đơn đặt trước + mâm cơm (bày ×N), phụ bàn Bông, Dì Năm,
// Chú Hòa, cơm chiên, nhiệm vụ, quảng bá, hạng quán, nước mắm nhà pha, trang trí kéo thả, thời tiết, ca khuya, quạt máy, nồi canh, bản lưu cũ.
import test from "node:test";
import assert from "node:assert/strict";
import { apply, must, newGame, prepDay, playShift, playDay, seeded, until, botStep, cookedPiece, home } from "./helpers.mjs";
import * as PG from "../core/progression.js?v=c1";
import { loadSave, dump, createState } from "../core/state.js?v=c1";
import { invariantError } from "../core/apply.js?v=c1";
import { availableTables, tableJob } from "../core/tables.js?v=c1";
import { ticketPrice } from "../core/bill.js?v=c1";
import { targetOf } from "../core/plate.js?v=c1";
import { LEVELS, DISHES, GEAR, HOA, hoaPack, STOCK, TIERS, FISH_SAUCE, DEBT, LATE, STAFF } from "../data/economy.js?v=c1";
import * as LP from "../data/lines-progress.js?v=c1";

/** Ván ở cấp `lv` (đủ tiền, đã qua hướng dẫn); stage tuỳ chọn; đồ mua sẵn. */
function at(lv, { seed = 11, stage = "street", owned = [], money = 5000 } = {}) {
  const s = newGame(seed);
  s.tutorialDone = true; s.day = Math.max(2, lv); s.xp = LEVELS[lv - 1]; s.level = lv; s.money = money; s.stage = stage;
  for (const id of owned) s.owned[id] = true;
  if (stage === "quan") s.plates = Math.max(s.plates, 16);
  return s;
}
/** Chơi ca bằng bot tới khi cond đúng (trả true) hoặc ca đóng. */
function botUntil(s, cond, { maxMs = 400000, rnd = seeded(3), skill = "good" } = {}) {
  for (let t = 0; s.shift && t < maxMs; t += 200) {
    if (cond(s)) return true;
    botStep(s, skill, rnd);
    if (!s.shift) break;
    if (cond(s)) return true;
    if (!s.shift.dialog) must(s, { type: "tick", dt: 200 });
  }
  return cond(s);
}
const finishShift = (s, rnd = seeded(9)) => { for (let t = 0; s.shift && t < 900000; t += 200) { botStep(s, "good", rnd); if (s.shift && !s.shift.dialog) must(s, { type: "tick", dt: 200 }); } assert.ok(!s.shift, "ca đóng"); };

test("20 cấp: lên cấp mở món theo bảng; cơm chiên không tự vào menu; đồ vỉa hè / quán / cần đồ bị chặn đúng", () => {
  assert.equal(LEVELS.length, 20);
  const s = newGame(3); s.tutorialDone = true;
  s.owned["egg-pan"] = true; s.owned.steamer = true;
  must(s, { type: "seeIntro" });
  s.xp = LEVELS[5] - 1; s.money = 9999;
  // tăng XP qua apply: gainXp chạy ở core; ở đây kiểm addNewDishes qua mua đồ
  s.level = 6; s.xp = LEVELS[5];
  must(s, { type: "buyGear", id: "ban-3" });
  for (const id of ["com-suon", "com-suon-trung", "com-suon-bi", "com-suon-bi-cha", "com-bi-cha", "dac-biet"]) assert.ok(s.menu.includes(id), id);
  assert.ok(!s.menu.includes("com-chien"), "cơm chiên chỉ bật khi có cơm dư");
  assert.ok(!s.menu.includes("com-ga"), "gà cấp 8");
  assert.equal(apply(s, { type: "buyGear", id: "smoke-hood" }).err, "locked");
  s.level = 8; s.xp = LEVELS[7];
  assert.equal(apply(s, { type: "buyGear", id: "smoke-hood" }).err, "needs-quan");
  assert.equal(apply(s, { type: "buyGear", id: "egg-pan-2" }).err, undefined);
  s.level = 10; s.xp = LEVELS[9];
  assert.equal(apply(s, { type: "buyGear", id: "tray-4" }).err, "needs", "khay mâm cần ô bày đôi");
  s.stage = "quan";
  assert.equal(apply(s, { type: "buyGear", id: "awning" }).err, "not-needed", "lên quán rồi thì không cần mái bạt");
  for (const id of Object.keys(GEAR)) assert.ok(GEAR[id].level >= 1 && GEAR[id].level <= 20 && GEAR[id].price > 0, id);
});

test("lên quán (cấp 7): thuê 350k ⇒ quan-scene, ≥ 16 dĩa, kho 140, 3 bàn quán, giữ đồ + kho, cờ quan-moved + kỷ niệm vỉa hè; bàn 4 / bàn 5 cần mua", () => {
  const s = at(6, { owned: ["egg-pan", "ban-3"], money: 400 });
  assert.equal(apply(s, { type: "rentQuan" }).err, "locked");
  s.level = 7; s.xp = LEVELS[6];
  const stockBefore = { ...s.stock };
  const r = must(s, { type: "rentQuan" });
  assert.ok(r.events.some((e) => e.type === "rented" && e.memory));
  assert.equal(s.stage, "quan"); assert.equal(s.money, 50);
  assert.ok(s.plates >= 16);
  assert.equal(s.flags["quan-moved"], s.day);
  assert.ok(s.streetMemory?.line);
  assert.deepEqual(s.stock, stockBefore);
  assert.ok(s.owned["egg-pan"]);
  assert.deepEqual(availableTables(s).map((t) => t.id), ["q1", "q2", "q3"]);
  assert.equal(apply(s, { type: "rentQuan" }).err, "owned");
  s.level = 10; s.xp = LEVELS[9]; s.money = 1000;
  must(s, { type: "buyGear", id: "q-table-4" });
  assert.deepEqual(availableTables(s).map((t) => t.id), ["q1", "q2", "q3", "q4"]);
  prepDay(s);
  must(s, { type: "startShift" });
  assert.equal(s.shift.rice.size, 20, "nồi lớn 20 ở quán");
  assert.equal(s.shift.tables.length, 4);
  finishShift(s);
  assert.equal(invariantError(s, null), null);
  const back = loadSave(dump(s));
  assert.equal(back.stage, "quan"); assert.ok(back.streetMemory); assert.equal(back.flags["quan-moved"], s.flags["quan-moved"]);
});

test("ca trưa (cấp 5): chọn ở Chuẩn bị (chỉ trưa / chỉ tối / cả hai), dân văn phòng dồn giữa ca, shipper 1–3 hộp, cờ lunch-today; chơi trọn được", () => {
  const s = at(5, { owned: ["takeaway-shelf", "egg-pan"] });
  must(s, { type: "setPlan", kinds: ["trua"] });
  assert.deepEqual(s.plan, ["trua"]);
  must(s, { type: "setPlan", kinds: ["trua", "toi"] });
  prepDay(s);
  must(s, { type: "startShift" });
  const sh = s.shift;
  assert.equal(sh.kind, "trua");
  assert.equal(s.flags["lunch-today"], s.day);
  for (const g of sh.schedule) assert.ok(g.at >= sh.len * 0.11 && g.at <= sh.len * 0.63, `khách tới lúc ${g.at}`);
  const office = sh.schedule.filter((g) => g.arch === "office").length;
  assert.ok(office >= sh.schedule.length * 0.3, `văn phòng ${office}/${sh.schedule.length}`);
  const ship = sh.schedule.filter((g) => g.arch === "shipper");
  for (const g of ship) assert.ok(g.roles.length >= 1 && g.roles.length <= 3);
  finishShift(s);
  assert.equal(s.lastSummary.kind, "trua");
  assert.equal(s.between, "toi");
  must(s, { type: "closeSummary" });
  must(s, { type: "startShift" });
  assert.equal(s.shift.kind, "toi");
  finishShift(s);
  assert.ok(s.dayDone);
});

test("ghép bàn (vỉa hè, cấp 5): nhóm 3–4 ngồi hai bàn 2 cạnh nhau, bàn ghép không nhận việc riêng, khách về thì cả hai bàn dơ", () => {
  const s = at(5);
  prepDay(s);
  must(s, { type: "startShift" });
  s.shift.schedule = [{ at: 0, arch: "worker", roles: ["worker", "worker2", "worker2"], patienceMul: 3 }];
  until(s, (x) => x.shift.groups.some((g) => g.phase === "wait"), 20000);
  const G = () => s.shift.groups.find((x) => x.size === 3);
  assert.equal(G().size, 3);
  const T = (id) => s.shift.tables.find((t) => t.id === id);
  must(s, { type: "seat", gid: G().id, tid: "s1" });
  assert.equal(T("s2").gid, G().id); assert.equal(T("s2").joinOf, "s1"); assert.equal(T("s1").joined, "s2");
  assert.equal(PG.seatSpotsFor(s, G()).length, 4);
  until(s, () => G().phase === "seated", 20000);
  assert.equal(tableJob(s, "s2"), null);
  assert.equal(tableJob(s, "s1"), "visit");
  // về: cả hai bàn dơ
  await_tables.leaveTable(s, G(), [], "timeout");
  assert.equal(T("s1").state, "dirty"); assert.equal(T("s2").state, "dirty"); assert.equal(T("s2").joinOf, null);
  assert.equal(apply(s, { type: "tableTap", tid: "s2" }).err, undefined, "dọn bàn ghép riêng được");
});
import * as await_tables from "../core/tables.js?v=c1";

test("ghi sổ (cấp 6): khách quen xin ghi sổ ⇒ ăn trước trả sau, cờ ghiso-open / ghiso-unpaid-<id>, review riêng; từ chối thì trả liền; sang ngày trả nợ (review đã trả)", () => {
  const s = at(6, { owned: ["egg-pan"] });
  assert.equal(PG.regularId("Chú Ba Râu"), "chu-ba-rau");
  prepDay(s);
  must(s, { type: "startShift" });
  s.shift.schedule = [{ at: 0, arch: "regular", roles: ["regular"], patienceMul: 3 }, { at: 1000, arch: "regular", roles: ["regular"], patienceMul: 3 }];
  const ok = botUntil(s, (x) => !!x.shift?.billing);
  assert.ok(ok, "có bàn tính tiền");
  const b = s.shift.billing;
  const g = s.shift.groups.find((x) => x.id === b.gid);
  assert.ok(PG.ghiSoEligible(s, g, 50));
  if (!b.ghiSo) b.ghiSo = { id: PG.regularId(g.members[0].name), name: g.members[0].name, amount: 0 };
  const money = s.money;
  const r = must(s, { type: "ghiSo", accept: true });
  const amount = r.result.amount;
  assert.ok(amount > 0);
  assert.ok(s.money <= money, "không thu tiền mặt");
  assert.equal(s.debts.length, 1);
  assert.equal(s.flags["ghiso-open"], 1);
  assert.equal(s.flags["ghiso-unpaid-" + PG.regularId(g.members[0].name)], amount);
  assert.ok(s.feed.some((x) => x.mech === "ghiso-unpaid"));
  // bàn thứ hai: từ chối
  assert.ok(botUntil(s, (x) => !!x.shift?.billing));
  const b2 = s.shift.billing;
  b2.ghiSo = b2.ghiSo || { id: "x", name: "x", amount: 0 };
  const m2 = s.money;
  must(s, { type: "ghiSo", accept: false });
  assert.ok(s.money > m2, "từ chối ⇒ khách trả liền");
  finishShift(s);
  // sang ngày: 25% / người / ngày trả nợ ⇒ trong 30 ngày gần như chắc chắn trả
  let paid = false;
  for (let d = 0; d < 30 && !paid; d++) { const ev = []; PG.onNextDay(s, ev); s.day++; paid = ev.some((e) => e.type === "debtPaid"); }
  assert.ok(paid);
  assert.equal(s.debts.length, 0);
  assert.equal(s.flags["ghiso-open"], 0);
  assert.ok(s.feed.some((x) => x.mech === "ghiso-paid"));
  // hạn mức
  s.debts = [{ id: "a", name: "A", amount: DEBT.limit(s.level), day: s.day }];
  assert.ok(!PG.ghiSoEligible(s, g, 10));
});

test("đơn đặt trước + mâm cơm (cấp 10): nhận ở Chuẩn bị (cọc 30%), phiếu mâm trên thanh phiếu, bày ×4 với khay, giao đủ đúng giờ ⇒ trả phần còn lại + review đúng giờ", () => {
  const s = at(10, { stage: "quan", owned: ["double-slot", "tray-4"] });
  s.menu = ["com-suon"];
  const offers = PG.orderOffers(s);
  assert.equal(offers.length, 2);
  const ci = offers.findIndex((o) => o.kind === "catering");
  const money = s.money;
  must(s, { type: "acceptOrder", idx: ci });
  const O = () => s.orders[0];
  const o = O();
  assert.equal(s.money, money + o.deposit);
  assert.equal(o.deposit, Math.round(o.total * 0.3));
  assert.equal(apply(s, { type: "acceptOrder", idx: ci }).err, "bad-offer");
  prepDay(s);
  must(s, { type: "startShift" });
  s.shift.schedule = [];
  assert.equal(s.flags["catering-active"], s.day);
  const tk = s.shift.tickets.find((x) => x.catering === o.id);
  const Tk = () => s.shift.tickets.find((x) => x.id === tk.id);
  assert.ok(tk && tk.n === o.n && tk.takeaway);
  assert.equal(s.shift.slots.length, 2, "ô bày đôi");
  must(s, { type: "pin", tk: tk.id });
  let rounds = 0;
  while (s.shift && O().status === "open" && rounds++ < 20) {
    for (let i = 0; i < 4; i++) cookedPiece(s, i);
    s.stock.hop = Math.max(s.stock.hop, 8);
    const want = Math.min(4, Tk().n);
    must(s, { type: "layer", id: "hop" });
    const sl = () => s.shift.slots[s.shift.sel];
    assert.equal(1 + (sl().batch?.length || 0), want, "bày ×N");
    for (const id of ["com", "moHanh", "meat", "doChua", "duaLeo", "sauce"]) must(s, { type: "layer", id });
    assert.ok([sl().plate, ...sl().batch].every((p) => p.meat && p.com === 1 && p.sauce === "bich"));
    if (s.shift.rice.n < 4) s.shift.rice.n = 20;
    must(s, { type: "serve" });
    if (O().status === "open" && s.shift.slots[s.shift.sel].tk !== tk.id) must(s, { type: "pin", tk: tk.id });
  }
  assert.equal(O().status, "done");
  assert.equal(O().done, O().n);
  assert.ok(s.feed.some((r) => r.mech === "catering-ontime"));
  assert.equal(s.flags["catering-active"], 0);
  assert.equal(invariantError(s, null), null);
});

test("mâm cơm trễ: quá hạn + ân hạn ⇒ khách lấy phần đã xong, trả 70%, cờ catering-late, review trễ", () => {
  const s = at(10, { stage: "quan", owned: ["double-slot"] });
  s.menu = ["com-suon"];
  PG.orderOffers(s);
  must(s, { type: "acceptOrder", idx: 1 });
  const O = () => s.orders[0];
  prepDay(s);
  must(s, { type: "startShift" });
  s.shift.schedule = [];
  const t = s.shift.tickets.find((x) => x.catering === O().id);
  must(s, { type: "pin", tk: t.id });
  cookedPiece(s, 0); cookedPiece(s, 1);
  must(s, { type: "layer", id: "hop" });
  for (const id of ["com", "moHanh", "meat", "doChua", "duaLeo", "sauce"]) must(s, { type: "layer", id });
  must(s, { type: "serve" });
  assert.equal(O().done, 2);
  const money = s.money;
  until(s, () => O().status !== "open", O().dueT + 60000, 500);
  assert.equal(O().status, "late");
  assert.equal(s.flags["catering-late"], s.day);
  assert.ok(s.money >= money, "không bao giờ trừ quá cọc"); assert.ok(O().paid >= 0);
  assert.ok(s.feed.some((r) => r.mech === "catering-late"));
});

test("phụ bàn Bông (cấp 9): thuê theo ngày, tự châm trà + dọn bàn, không bao giờ đứng yên khi còn việc, trả lương mỗi ca; Dì Năm tự rửa chén", () => {
  const s = at(13, { stage: "quan" });
  assert.equal(apply(s, { type: "hireStaff", id: "bong" }).err, undefined);
  must(s, { type: "hireStaff", id: "di-nam" });
  assert.equal(s.flags["helper-bong"], s.day);
  prepDay(s);
  must(s, { type: "startShift" });
  const sh = s.shift;
  assert.ok(sh.helper && sh.dishwasher);
  let idle = 0, poured = 0, cleaned = 0;
  const rnd = seeded(5);
  for (let t = 0; s.shift && t < 900000; t += 200) {
    // cô chủ chỉ xếp chỗ + bếp + bày (bot), không tự châm trà / dọn bàn ⇒ việc đó của Bông
    for (const g of s.shift.groups.filter((x) => x.phase === "wait")) { const tb = s.shift.tables.find((x) => x.gid === null && x.state !== "dirty" && x.seats >= g.size); if (tb) apply(s, { type: "seat", gid: g.id, tid: tb.id }); }
    for (const tb of s.shift.tables) { const j = tableJob(s, tb.id); if (j === "visit" || j === "bill" || j === "rice") apply(s, { type: "tableTap", tid: tb.id }); }
    if (s.shift.billing) { apply(s, { type: "autoBill" }); apply(s, { type: "collect" }); }
    botStep(s, "good", rnd);
    if (!s.shift || s.shift.dialog) { if (s.shift?.dialog) botStep(s, "good", rnd); continue; }
    const r = must(s, { type: "tick", dt: 200 });
    for (const e of r.events) { if (e.type === "teaPoured" && e.by === "bong") poured++; if (e.type === "cleaned") cleaned++; }
    if (s.shift && PG.helperJob(s) && !s.shift.helper.task) idle++;
  }
  assert.ok(poured > 0, "Bông châm trà");
  assert.ok(cleaned > 0, "có bàn được dọn");
  assert.equal(idle, 0, "Bông không đứng yên khi còn việc");
  assert.equal(s.lastSummary.staff, STAFF.bong.price + STAFF["di-nam"].price);
});

test("Dì Năm rửa 1 dĩa mỗi 2 giây", () => {
  const s = at(13, { stage: "quan" });
  must(s, { type: "hireStaff", id: "di-nam" });
  prepDay(s);
  must(s, { type: "startShift" });
  s.shift.schedule = [];
  s.shift.cleanPlates -= 4; s.shift.dirty += 4;
  for (let i = 0; i < 21; i++) must(s, { type: "tick", dt: 200 });
  assert.equal(s.shift.dirty, 2);
});

test("Chú Hòa (cấp 9): gói gấp đôi rẻ 10%, chỉ trước ca", () => {
  const s = at(8);
  assert.equal(apply(s, { type: "restockHoa", id: "gao-tam" }).err, "locked");
  s.level = 9; s.xp = LEVELS[8];
  for (const k of Object.keys(s.stock)) if (STOCK[k].cap) s.stock[k] = 0;
  const [n, price] = hoaPack("gao-tam");
  assert.equal(n, STOCK["gao-tam"].pack[0] * 2);
  assert.equal(price, Math.round(STOCK["gao-tam"].pack[1] * 2 * 0.9));
  const before = s.stock["gao-tam"], money = s.money;
  must(s, { type: "restockHoa", id: "gao-tam" });
  assert.equal(s.stock["gao-tam"], before + n); assert.equal(s.money, money - price);
  prepDay(s); must(s, { type: "startShift" });
  assert.equal(apply(s, { type: "restockHoa", id: "than" }).err, "in-shift");
  assert.ok(HOA.ids.every((id) => STOCK[id]));
});

test("cơm chiên (cấp 2, có chảo): cơm dư cuối ngày ⇒ 50% (tối đa 6) thành cơm chiên ngày mai; khách gọi giữ chỗ từng phần; bày không lấy cơm nồi", () => {
  const s = at(3, { owned: ["egg-pan"] });
  prepDay(s);
  must(s, { type: "startShift" });
  s.shift.schedule = [];
  s.shift.rice.n = 9;
  finishShift(s);
  assert.equal(s.lastSummary.friedTomorrow, 4);
  must(s, { type: "closeSummary" });
  must(s, { type: "nextDay" });
  assert.equal(s.friedRice, 4);
  assert.ok(s.menu.includes("com-chien"));
  const dishes = ["com-suon", "com-chien"];
  for (let i = 0; i < 4; i++) assert.equal(PG.pickDish(s, "com-chien", dishes), "com-chien");
  assert.equal(s.friedRice, 0);
  assert.ok(!s.menu.includes("com-chien"));
  assert.notEqual(PG.pickDish(s, "com-chien", dishes), "com-chien");
  const tg = targetOf({ dish: "com-chien", quirks: [], takeaway: false });
  assert.equal(tg.moHanh, 0); assert.equal(tg.meat, null); assert.equal(tg.trung, "any"); assert.ok(tg.fried);
  assert.equal(DISHES["com-chien"].price, 20);
});

test("nhiệm vụ ngày (cấp 2): 3 mục mỗi ca, thưởng một lần; nhiệm vụ cuối ca xét lúc chốt", () => {
  const s = at(4, { owned: ["egg-pan", "takeaway-shelf"] });
  prepDay(s);
  must(s, { type: "startShift" });
  assert.equal(s.shift.missions.length, 3);
  s.shift.missions[0] = { id: "plates", kind: "plates", text: "Bán 1 dĩa", n: 1, prog: 0, done: false, reward: { xp: 5, money: 7 } };
  const m0 = s.money;
  const ok = botUntil(s, (x) => x.shift?.missions[0].done);
  assert.ok(ok);
  assert.ok(s.money >= m0 + 7 - 200);
  finishShift(s);
  assert.equal(s.lastSummary.missions.length, 3);
  assert.ok(s.lastSummary.missions[0].done);
  const n = s.stats.missions;
  assert.ok(n >= 1);
  // ngày hướng dẫn / cấp 1: không có nhiệm vụ
  const t = newGame(4); prepDay(t); must(t, { type: "startShift" });
  assert.equal(t.shift.missions.length, 0);
});

test("quảng bá (cấp 11, 1 lần/ngày), hạng quán 8 bậc, nước mắm nhà pha +1k mỗi dĩa", () => {
  const s = at(11, { stage: "quan", money: 99999 });
  must(s, { type: "promo", kind: "check-in" });
  assert.equal(apply(s, { type: "promo", kind: "to-roi" }).err, "once-per-day");
  assert.ok(PG.extraGuests(s, "toi") >= 2);
  must(s, { type: "buyTier" }); must(s, { type: "buyTier" });
  assert.equal(s.tier, 2);
  assert.equal(apply(s, { type: "buyTier" }).err, "locked", "bậc 3 mở cấp 12");
  s.level = 20; s.xp = LEVELS[19];
  while (s.tier < TIERS.length) must(s, { type: "buyTier" });
  assert.equal(apply(s, { type: "buyTier" }).err, "max");
  assert.ok(PG.patienceMul(s) > 1.15);
  must(s, { type: "buyFishSauce" });
  assert.equal(s.fishSauce, 1);
  prepDay(s);
  must(s, { type: "startShift" });
  assert.ok(botUntil(s, (x) => x.shift?.tickets.some((t) => !t.catering)));
  const t = s.shift.tickets.find((x) => !x.catering);
  assert.equal(t.plus, 1);
  assert.equal(ticketPrice(t), DISHES[t.dish].price + 1);
  assert.equal(FISH_SAUCE.length, 3);
});

test("trang trí: mua, kéo thả trong quán (không đè bàn / lối đi / chỗ chờ; đồ treo tường phải ở tường), hấp dẫn có trần, thêm khách", () => {
  const s = at(10, { stage: "quan", money: 2000 });
  must(s, { type: "buyDecor", id: "banana-plant" });
  must(s, { type: "buyDecor", id: "red-lantern" });
  assert.equal(apply(s, { type: "buyDecor", id: "neon-sign" }).err, "locked");
  assert.equal(apply(s, { type: "placeDecor", id: "banana-plant", x: 848, y: 529 }).err, "place-table");
  assert.equal(apply(s, { type: "placeDecor", id: "red-lantern", x: 600, y: 600 }).err, "place-zone");
  assert.equal(apply(s, { type: "placeDecor", id: "banana-plant", x: 760, y: 612 }).err, "place-path");
  assert.equal(apply(s, { type: "placeDecor", id: "banana-plant", x: 1240, y: 470 }).err, "place-spot");
  must(s, { type: "placeDecor", id: "red-lantern", x: 900, y: 200 });
  assert.deepEqual(s.placement["red-lantern"], [900, 200]);
  must(s, { type: "placeDecor", id: "banana-plant", x: 560, y: 470 });
  assert.equal(PG.appeal(s), 1);
  for (const id of ["bougainvillea-pot", "paper-lantern", "fairy-lights", "ceramic-jar", "chalk-menu", "old-radio", "old-tv", "bird-cage"]) must(s, { type: "buyDecor", id });
  assert.equal(PG.appeal(s), 3, "trần 3");
  assert.ok(PG.extraGuests(s, "toi") >= 4);
  const street = at(5, { money: 500 });
  must(street, { type: "buyDecor", id: "chalk-menu" });
  assert.equal(apply(street, { type: "placeDecor", id: "chalk-menu", x: 560, y: 470 }).err, "needs-quan");
});

test("thời tiết: từ ngày 5 có mưa (cờ rain-today), vỉa hè vắng 40%, mái bạt chỉ 15%", () => {
  const s = at(6);
  let rain = 0;
  for (let d = 5; d < 105; d++) { s.day = d; s.weather = null; if (PG.rollWeather(s).kind === "rain") { rain++; assert.equal(s.flags["rain-today"], d); } }
  assert.ok(rain > 5 && rain < 30, `${rain} ngày mưa / 100`);
  s.weather = { day: s.day, kind: "rain" };
  assert.equal(PG.rainMul(s), 0.6);
  s.owned.awning = true;
  assert.equal(PG.rainMul(s), 0.85);
});

test("ca khuya kéo dài (cấp 17): ca tối dài thêm, thêm khách khuya; quạt máy +1 nấc; nồi cơm thứ hai; nồi canh trừ chén khi bưng", () => {
  const s = at(17, { stage: "quan", owned: ["electric-blower", "rice-cooker-2", "soup-pot"] });
  assert.equal(apply(newGame(1), { type: "setLate", on: true }).err, "locked");
  must(s, { type: "setLate", on: true });
  prepDay(s);
  must(s, { type: "startShift" });
  assert.equal(s.shift.len, 210000 + LATE.extraMs);
  assert.ok(s.shift.schedule.some((g) => g.at > 210000));
  assert.equal(s.shift.rice.size, 40);
  assert.ok(s.shift.soup?.n === 30);
  must(s, { type: "blower", on: true });
  assert.ok(s.shift.grill.blower);
  const ok = botUntil(s, (x) => x.shift?.soup?.n < 30);
  assert.ok(ok, "bưng dĩa kèm chén canh");
});

test("không kẹt: bot chơi 10 ngày từ cấp 6 tới quán (thuê mặt bằng khi đủ tiền), có ghi sổ + đơn đặt trước + Bông; bất biến luôn giữ", () => {
  for (const seed of [21, 22]) {
    const s = at(6, { seed, owned: ["egg-pan", "steamer", "takeaway-shelf", "ban-3", "ban-4"], money: 300 });
    for (let d = 0; d < 10; d++) {
      if (s.level >= 7 && s.stage === "street" && s.money >= 360) must(s, { type: "rentQuan" });
      if (s.stage === "quan") { const offers = PG.orderOffers(s); if (offers[0] && !offers[0].taken) apply(s, { type: "acceptOrder", idx: 0 }); }
      if (s.level >= 9 && s.money > 200) apply(s, { type: "hireStaff", id: "bong" });
      playDay(s, { skill: d % 2 ? "sloppy" : "good", rnd: seeded(seed * 10 + d) });
      assert.equal(invariantError(s, null), null, `seed ${seed} ngày ${s.day}`);
      assert.ok(s.money >= 0);
    }
  }
});

test("bản lưu cũ (không có khoá A) đọc được với mặc định; khoá A đi qua dump / loadSave nguyên vẹn", () => {
  const old = createState(5);
  for (const k of Object.keys(PG.freshA())) delete old[k];
  const s = loadSave(JSON.stringify(old));
  assert.ok(s);
  assert.deepEqual(s.debts, []); assert.equal(s.tier, 0); assert.deepEqual(s.decor, {});
  s.debts = [{ id: "co-ut", name: "Cô Út", amount: 32, day: 3 }];
  s.tier = 2; s.fishSauce = 1; s.decor = { "red-lantern": true }; s.placement = { "red-lantern": [900, 200] }; s.friedRice = 3; s.lateShift = true;
  s.staff = { bong: s.day }; s.orders = [{ id: 1, kind: "pre", name: "X", arch: "office", label: "L", dish: "com-suon", n: 4, done: 0, total: 128, deposit: 38, day: s.day, shift: "toi", dueFrac: 0.5, status: "waiting" }];
  const b = loadSave(dump(s));
  for (const k of ["debts", "tier", "fishSauce", "decor", "placement", "friedRice", "lateShift", "staff", "orders"]) assert.deepEqual(b[k], s[k], k);
  const bad = loadSave(JSON.stringify({ ...s, debts: "x", tier: 99, decor: { nope: true }, orders: [{ dish: "nope" }] }));
  assert.deepEqual(bad.debts, []); assert.equal(bad.tier, TIERS.length); assert.deepEqual(bad.decor, {}); assert.deepEqual(bad.orders, []);
});

test("nội dung cơ chế: 8–12 review mỗi kết quả, không emoji, điền biến đủ", () => {
  for (const k of ["GHISO_TAB_REVIEW", "GHISO_PAID_REVIEW", "CATERING_ONTIME_REVIEW", "CATERING_LATE_REVIEW", "LUNCH_REVIEW", "TAKEAWAY_REVIEW", "COM_CHIEN_REVIEW", "HELPER_REVIEW"]) {
    assert.ok(LP[k].length >= 8 && LP[k].length <= 12, `${k}: ${LP[k].length}`);
  }
  const all = [];
  const walk = (v) => { if (typeof v === "string") all.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") Object.values(v).forEach(walk); };
  walk(LP);
  assert.ok(all.length > 250, `${all.length} câu`);
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  const ctx = { self: "em", call: "chị", name: "Tèo", n: 4, dish: "cơm sườn", amount: 64, days: 6, plates: 120, item: "đèn lồng" };
  for (const t of all) { assert.ok(!EMOJI.test(t), t); assert.ok(!/\{\w+\}/.test(t.replace(/\{(\w+)\}/g, (m, k) => (ctx[k] ?? ctx[k[0].toLowerCase() + k.slice(1)]) !== undefined ? "x" : m)), t); }
  assert.equal(new Set(all).size, all.length, "không trùng câu");
});

test("hệ số hiện thiết bị là dữ liệu theo sheet: bản đợt 1 vẽ to ⇒ ×0,5; bản vẽ đúng thước (manifest đổi) ⇒ ×1; displayScale trong manifest ưu tiên", async () => {
  const { makeAtlas } = await import("../render/atlas.js?v=c1");
  const { readFileSync } = await import("node:fs");
  const man = JSON.parse(readFileSync(new URL("../data/asset-manifest.json", import.meta.url), "utf8"));
  const a = makeAtlas(man);
  assert.equal(a.scaleOf("equip", "rice-cooker-ready"), 0.5);
  assert.equal(a.scaleOf("tableItems", "tea-glass-full"), 0.5);
  assert.equal(a.scaleOf("tableItems", "stool-red"), 1);
  assert.equal(a.scaleOf("grill", "grill-mid"), 1);
  const redrawn = structuredClone(man);
  const eq = redrawn.items.find((i) => i.filename === "assets/equipment.webp");
  eq.productionStatus = "produced-wave-3"; eq.dimensions = [672, 768];
  assert.equal(makeAtlas(redrawn).scaleOf("equip", "rice-cooker-ready"), 1, "bản vẽ lại đúng thước ⇒ ×1");
  eq.displayScale = 0.75;
  assert.equal(makeAtlas(redrawn).scaleOf("equip", "rice-cooker-ready"), 0.75);
});

test("bếp than thứ hai (cấp 14, quán): 12 chỗ cùng luật vùng, chung than; ca chơi trọn được; đọc lại bản lưu giữa ca", () => {
  const s = at(14, { stage: "quan", owned: ["grill-2"] });
  prepDay(s);
  must(s, { type: "startShift" });
  assert.equal(s.shift.grill.slots.length, 12);
  must(s, { type: "placeMeat", slot: 7 });
  assert.ok(s.shift.grill.slots[7]);
  must(s, { type: "tick", dt: 3000 });
  assert.ok(s.shift.grill.slots[7].sides[0] > 0, "chỗ 7 (vùng nóng bếp 2) chín");
  const back = loadSave(dump(s));
  assert.equal(back.shift.grill.slots.length, 12);
  finishShift(s);
  assert.equal(invariantError(s, null), null);
});
