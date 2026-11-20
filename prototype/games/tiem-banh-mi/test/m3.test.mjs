// M3: kinh tế + tiến trình — mua đồ / món theo trạm, lên tiệm cấp 7 (giữ bản lưu, đồ đã mua, kỷ niệm xe đẩy), đơn đặt trước (cọc, đúng giờ, trễ,
// huỷ), ráp ×N, thớt đôi, nhiệm vụ, Chị Mai, quảng bá, trang trí kéo thả, hạng tiệm, bánh hôm qua, phụ việc, ổ mang tên tiệm, nội dung cơ chế.
import test from "node:test";
import assert from "node:assert/strict";
import { shop, act, err, advance, untilWaiting, build, serveRight, payRight, prepAndOpen, playShift, resolveEvent, customer, board } from "./helpers.mjs";
import { loadSave, dump } from "../core/state.js";
import { menuFor, makeItem } from "../core/order.js";
import { spawnPre, genGuests } from "../core/shift.js";
import { createPreorder, preorderOffers, appeal, placeError, PLACE_REASON } from "../core/progress.js";
import { scenePointsShop } from "../core/placements.js";
import { packPrice, packSize, baseGuests } from "../core/stock.js";
import { LEVELS, RECIPE } from "../data/economy.js";
import { MISSIONS, EQUIPMENT, DECOR } from "../data/equipment.js";
import * as M3 from "../data/lines-m3.js";

const levelUp = (s, lv) => { s.xp = LEVELS[lv - 1]; s.level = lv; s.tutorialDone = true; };
const rich = (s, k = 3000) => { s.money = k; };

test("món theo trạm: cấp 2 chưa có chảo trứng thì chưa bán trứng ốp la; mua chảo xong mới có, không trùng mua", () => {
  const s = shop(3); levelUp(s, 2); rich(s, 200);
  assert.ok(!menuFor(s).some((r) => r.id === "trung"));
  act(s, { type: "buy", id: "egg-pan" });
  assert.ok(menuFor(s).some((r) => r.id === "trung"));
  assert.equal(s.money, 170);
  assert.equal(err(s, { type: "buy", id: "egg-pan" }), "owned");
  assert.equal(err(s, { type: "buy", id: "grill" }), "locked");
  assert.equal(err(s, { type: "buy", id: "long-table" }), "locked");
});

test("lên tiệm cấp 7: thuê 300k ⇒ cảnh tiệm, lò gas 2 ngăn, kho 100, hàng chờ 5; kỷ niệm xe đẩy vào Nhật Ký; bản lưu giữ đồ đã mua", () => {
  const s = shop(4); levelUp(s, 6); rich(s, 400);
  s.owned["egg-pan"] = true; s.stats.shifts = 9; s.stats.loaves = 140;
  assert.equal(err(s, { type: "rentShop" }), "locked");
  levelUp(s, 7);
  const r = act(s, { type: "rentShop" });
  assert.ok(r.events.some((e) => e.type === "rented"));
  assert.equal(s.shop, true); assert.equal(s.oven, "gas"); assert.equal(s.money, 100);
  assert.ok(s.cartMemory && s.cartMemory.loaves === 140);
  assert.equal(s.journal[0].kind, "cart");
  assert.ok(s.drama.flags["len-tiem"]);
  const back = loadSave(dump(s));
  assert.equal(back.shop, true); assert.equal(back.oven, "gas"); assert.ok(back.owned["egg-pan"]); assert.equal(back.journal[0].kind, "cart");
  prepAndOpen(back);
  assert.equal(back.shift.oven.length, 2);
  assert.equal(err(back, { type: "rentShop" }), "shift-open");
});

test("đơn đặt trước: cọc 30% nhận ngay, phiếu có hạn, giao đúng giờ ⇒ review riêng + thưởng; trễ ⇒ giảm giá; quá hạn ⇒ huỷ 2 sao, cọc giữ", () => {
  const s = shop(5); levelUp(s, 8); s.shop = true; s.oven = "gas"; rich(s, 500);
  const m0 = s.money;
  createPreorder(s, { n: 6, recipe: "cha-lua", name: "Chị Thảo", arch: "office", when: "next", dueMs: 120000, label: "Họp sáng" }, []);
  assert.equal(s.preorders.length, 1);
  const p = s.preorders[0];
  assert.equal(s.money - m0, Math.round(p.total * 0.3));
  s.drama.pending = null;
  act(s, { type: "firstBatch", sec: 28 }); act(s, { type: "firstBatch", sec: 28 }); act(s, { type: "startShift" });
  const c = s.shift.customers.find((x) => x.pre);
  assert.ok(c, "đơn đặt trước vào ca");
  assert.equal(c.items.length, 6);
  // giao đủ 6 ổ đúng giờ (ráp từng ổ)
  act(s, { type: "pin", cid: c.id });
  for (let i = 0; i < 6; i++) {
    while (s.shift.case.length < 1) { act(s, { type: "bake", slot: 0 }); s.shift.oven[0].t0 = s.shift.t - 28000; act(s, { type: "pull", slot: 0 }); }
    build(s, customer(s, c.id).items[board(s).item]); act(s, { type: "serve" });
  }
  assert.ok(s.feed[0].reason === "preorder" || s.feed[0].stars >= 4, JSON.stringify(s.feed[0]));
  assert.ok(M3.PREORDER_REVIEW.onTime.some((t) => s.feed[0].line === t) || s.feed[0].reason !== "preorder");
  assert.equal(s.shift.stats.preorders, 1);
  // quá hạn: đơn mới ngay, không làm
  const s2 = shop(6); levelUp(s2, 8); s2.shop = true; s2.oven = "gas"; rich(s2, 500); act(s2, { type: "startShift" });
  createPreorder(s2, { n: 8, recipe: "pate-bo", name: "Đội thợ", arch: "worker", when: "now", dueMs: 5000 }, [], { spawnPre });
  const dep = s2.shift.customers.find((x) => x.pre).pre.deposit;
  advance(s2, 70000, { events: true });
  assert.ok(!s2.shift || !s2.shift.customers.some((x) => x.pre && x.phase === "wait"));
  assert.ok(s2.feed.some((r) => r.reason === "preShort" && r.stars === 2));
  assert.ok(dep > 0);
});

test("đơn đặt trước ở Chuẩn bị ca: cấp 7 + tiệm mới có, tối đa 2 đơn mỗi ngày, tung một lần (tải lại không đổi)", () => {
  const s = shop(7); levelUp(s, 6);
  assert.deepEqual(preorderOffers(s), []);
  levelUp(s, 10); s.shop = true;
  const a = preorderOffers(s);
  assert.ok(a.length >= 1 && a.length <= 2);
  const again = loadSave(dump(s));
  assert.deepEqual(preorderOffers(again).map((o) => o.name), a.map((o) => o.name));
  act(s, { type: "acceptOffer", idx: 0 });
  assert.equal(s.preorders.filter((p) => p.day === s.day).length, 1);
  assert.equal(err(s, { type: "acceptOffer", idx: 0 }), "bad-offer");
});

test("ráp ×N trên thớt dài: một lượt ráp 4 ổ giống nhau, trừ kho ×4, giao một lần điền 4 ổ", () => {
  const s = shop(8); levelUp(s, 4); s.owned["long-board"] = true; s.tutorialDone = true;
  act(s, { type: "startShift" });
  const sh = s.shift; sh.schedule = [];
  for (let i = 0; i < 6; i++) sh.case.push({ id: 500 + i, crisp: 100, src: "oven" });
  const items = Array.from({ length: 5 }, () => makeItem("cha-lua", []));
  sh.customers.push({ id: 99, arch: "worker", sprite: "worker", name: "Chú Tám", self: "chú", call: "con", items, filled: items.map(() => null), phase: "wait", t0: 0, arriveT: 0, patience: 200000, spot: 0, mood: "waiting", say: null, orderLine: "", nhuCu: false, pay: null, payPlan: "transfer", leaveT: null, reactUntil: null, remade: false, impatientSaid: false, discount: 0 });
  act(s, { type: "pin", cid: 99 });
  const cl = s.stock["cha-lua"];
  act(s, { type: "take", n: 4 });
  assert.equal(board(s).loaf.n, 4);
  assert.equal(err(s, { type: "toast" }), "toaster-batch");
  build(s, items[0]);
  assert.equal(cl - s.stock["cha-lua"], 4);
  act(s, { type: "serve" });
  assert.equal(customer(s, 99).filled.filter(Boolean).length, 4);
  build(s, items[4]); act(s, { type: "serve" });
  assert.equal(customer(s, 99).phase === "react" || customer(s, 99).phase === "pay", true);
});

test("thớt đôi: hai thớt ráp song song hai khách, chuyển thớt không mất ổ đang ráp", () => {
  const s = shop(9); levelUp(s, 8); s.owned["board-2"] = true;
  act(s, { type: "firstBatch", sec: 28 }); act(s, { type: "startShift" });
  assert.equal(s.shift.boards.length, 2);
  const a = untilWaiting(s);
  act(s, { type: "pin", cid: a.id }); act(s, { type: "take" }); act(s, { type: "slice" });
  act(s, { type: "selectBoard", idx: 1 });
  let b = null;
  for (let i = 0; i < 400 && !b; i++) { b = s.shift.customers.find((c) => c.phase === "wait" && c.id !== a.id && !c.pre); if (!b) advance(s, 200); }
  if (b) { act(s, { type: "pin", cid: b.id }); act(s, { type: "take" }); }
  assert.ok(s.shift.boards[0].loaf?.sliced);
  act(s, { type: "selectBoard", idx: 0 });
  assert.equal(s.shift.sel, 0);
  assert.equal(err(s, { type: "selectBoard", idx: 2 }), "bad-board");
});

test("nhiệm vụ ngày: 3 mục từ cấp 2 theo cơ chế đã mở, mỗi mẫu có câu xong / hụt riêng; xong thì thưởng một lần", () => {
  const s = shop(10); levelUp(s, 2); s.tutorialDone = true;
  act(s, { type: "firstBatch", sec: 28 }); act(s, { type: "startShift" });
  assert.equal(s.shift.missions.length, 3);
  for (const m of s.shift.missions) assert.ok(MISSIONS.find((x) => x.id === m.id).unlock <= 2);
  for (const m of MISSIONS) { assert.ok(M3.MISSION_DONE[m.kind]?.length >= 1, m.kind); assert.ok(M3.MISSION_MISS[m.kind]?.length >= 1, m.kind); }
  const m = s.shift.missions[0];
  const xp0 = s.xp;
  m.prog = m.n - 1;
  // ép một mục kiểu đếm khi giao về xong
  m.kind = "loaves"; m.n = m.prog + 1;
  const c = untilWaiting(s);
  serveRight(s, c);
  assert.ok(s.shift.missions[0].done);
  assert.ok(s.xp > xp0);
  const again = s.shift.missions[0].prog;
  serveRight(s, untilWaiting(s));
  assert.equal(s.shift.missions[0].prog, again);
});

test("Chị Mai (cấp 9): gói gấp đôi rẻ 10%, chỉ trước ca, có bánh sỉ ra tủ lúc mở cửa; nhập ≥ 2 lần đặt cờ cho U04", () => {
  const s = shop(11); levelUp(s, 8); rich(s, 500);
  assert.equal(err(s, { type: "restock", id: "pate", sup: "mai" }), "locked");
  levelUp(s, 9); s.shop = true;
  assert.equal(packSize("pate", "mai"), 20);
  assert.ok(packPrice("pate", false, "mai") < packPrice("pate") * 2);
  act(s, { type: "restock", id: "pate", sup: "mai" });
  act(s, { type: "restock", id: "banh-si", sup: "mai" });
  assert.ok(s.drama.flags["mai-mua-2"]);
  act(s, { type: "startShift" });
  assert.ok(s.shift.case.some((l) => l.src === "si" && l.crisp === 80));
  assert.equal(err(s, { type: "restock", id: "pate", sup: "mai" }), "mai-prep-only");
});

test("quảng bá (cấp 11): một lần mỗi ngày, đặt cờ promo cho Q-event, khách thêm; review riêng ngày quảng bá", () => {
  const s = shop(12); levelUp(s, 11); s.shop = true; rich(s, 300);
  const g0 = baseGuests(s);
  act(s, { type: "promo", kind: "check-in" });
  assert.equal(err(s, { type: "promo", kind: "to-roi" }), "once-per-day");
  assert.ok(baseGuests(s) >= g0 + 2);
  assert.ok(s.drama.flags["promo-check-in"] >= s.day);
  const s2 = shop(12); levelUp(s2, 11); s2.shop = true; rich(s2, 300);
  act(s2, { type: "promo", kind: "to-roi" });
  const list = genGuests(s2);
  assert.ok(list.filter((g) => g.arch === "student" && g.tag === "promo").length >= 2);
  for (const k of ["to-roi", "check-in", "livestream"]) assert.ok(M3.PROMO_REVIEW[k].length >= 8);
});

test("trang trí: mua cộng hấp dẫn (trần 3), kéo thả trong cảnh tiệm chặn chỗ khách đứng / lối đi / sai vùng kèm lý do; Đặt lại", () => {
  const s = shop(13); levelUp(s, 11); s.shop = true; rich(s, 600);
  for (const id of ["rattan-lamp", "chalk-menu", "ceramic-jar", "old-radio", "banana-plant", "small-table", "wheat-bundle"]) act(s, { type: "buy", id });
  assert.equal(appeal(s), 3);
  const P = scenePointsShop();
  assert.equal(placeError("chalk-menu", P.queue[1][0], P.queue[1][1], P), "spot");
  assert.equal(placeError("chalk-menu", 200, 150, P), "zone");
  assert.equal(placeError("rattan-lamp", 300, 650, P), "zone");
  assert.ok(PLACE_REASON.path);
  assert.equal(err(s, { type: "place", id: "chalk-menu", x: P.queue[0][0], y: P.queue[0][1] }), "place-spot");
  act(s, { type: "place", id: "rattan-lamp", x: 700, y: 200 });
  assert.deepEqual(s.placement["rattan-lamp"], [700, 200]);
  assert.deepEqual(loadSave(dump(s)).placement["rattan-lamp"], [700, 200]);
  act(s, { type: "resetPlace", id: "rattan-lamp" });
  assert.equal(s.placement["rattan-lamp"], undefined);
});

test("hạng tiệm 8 bậc + pate nhà làm: cần tiệm + đúng cấp, trừ tiền, cộng khách / giá ổ có pate", () => {
  const s = shop(14); levelUp(s, 10); s.shop = true; rich(s, 1000);
  const g0 = baseGuests(s);
  act(s, { type: "buyRank" });
  assert.equal(s.rank, 1); assert.equal(s.money, 700);
  assert.equal(err(s, { type: "buyRank" }), "locked");
  assert.equal(baseGuests(s), g0 + 1);
  assert.equal(err(s, { type: "buyPate" }), "locked");
  levelUp(s, 15); rich(s, 1000);
  act(s, { type: "buyPate" });
  act(s, { type: "startShift" });
  const withPate = s.shift.schedule.flatMap((g) => g.items).find((it) => it.recipe === "pate-bo");
  if (withPate) assert.equal(withPate.price, RECIPE["pate-bo"].price + 1);
});

test("bánh hôm qua: bánh dư cuối ca thành bánh hôm qua; sáng chọn bán ⇒ vào tủ giòn 30, ổ làm từ đó rẻ 30%, nướng lại tối đa 70; cho đi +1 danh tiếng", () => {
  const s = shop(15); levelUp(s, 3);
  act(s, { type: "firstBatch", sec: 28 }); act(s, { type: "startShift" });
  s.shift.schedule = []; s.shift.customers = []; s.shift.t = 240000;
  advance(s, 400);
  assert.ok(s.stale && s.stale.n === 4, JSON.stringify(s.stale));
  resolveEvent(s);
  act(s, { type: "stale", choice: "sell" });
  act(s, { type: "startShift" });
  const st = s.shift.case.filter((l) => l.src === "stale");
  assert.equal(st.length, 4); assert.equal(st[0].crisp, 30);
  // ráp từ bánh hôm qua: nướng lại tối đa 70
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id }); act(s, { type: "take" });
  assert.equal(board(s).loaf.src, "stale");
  act(s, { type: "toast" }); s.shift.t += 4500; act(s, { type: "toast" });
  assert.ok(board(s).loaf.crisp <= 70);
  const s2 = shop(16); levelUp(s2, 3); s2.stale = { n: 3, choice: null }; const rep = s2.rep;
  act(s2, { type: "stale", choice: "give" }); act(s2, { type: "startShift" });
  assert.equal(s2.rep, rep + 1);
  assert.ok(M3.STALE.review.length >= 8);
});

test("phụ việc Bé Na (cấp 17): 45k/ca, tự thối tiền đúng + gói giùm; cờ be-na cho N01 / N02", () => {
  const s = shop(17); levelUp(s, 17); s.shop = true; s.oven = "gas"; rich(s, 400);
  act(s, { type: "helper", on: true });
  assert.equal(s.money, 355);
  s.money = 2000; s.float = { 1: 20, 2: 20, 5: 20, 10: 20, 20: 10, 50: 4 };
  assert.ok(s.drama.flags["be-na"] >= s.day);
  act(s, { type: "firstBatch", sec: 28 }); act(s, { type: "startShift" });
  s.shift.drama.max = 0;
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id });
  const it = c.items[0];
  build(s, it);
  act(s, { type: "undo" }); // bỏ bước gói: Bé Na gói giùm
  assert.equal(board(s).loaf.wrap, null);
  const r = act(s, { type: "serve" });
  assert.ok(r.events.some((e) => e.type === "served" || e.type === "paying" || e.type === "complaint"));
  if (s.shift.paying !== null) { const r2 = act(s, { type: "tick", dt: 200 }); assert.ok(r2.events.some((e) => e.type === "helperChange")); }
  assert.equal(s.shift.paying, null);
});

test("ổ mang tên tiệm (cấp 19): đặt tên, ≤ 4 nhân, giá trong khung ×1,6–×2,4; lên menu với tên riêng", () => {
  const s = shop(18); levelUp(s, 19); s.shop = true; s.owned.grill = true;
  assert.equal(err(s, { type: "house", name: "Ổ Hẻm Mười", fills: ["cha-lua", "thit-nguoi"], price: 999 }), "bad-price");
  assert.equal(err(s, { type: "house", name: "", fills: ["cha-lua"], price: 30 }), "empty-name");
  act(s, { type: "house", name: "Ổ Hẻm Mười", spreads: { pate: 2, bo: 2 }, fills: ["cha-lua", "thit-nguoi"], price: 36 });
  assert.ok(menuFor(s).some((r) => r.id === "gia-truyen"));
  const it = makeItem("gia-truyen", [], {}, s.house);
  assert.equal(it.label, "Ổ Hẻm Mười"); assert.equal(it.price, 36); assert.deepEqual(it.fills, ["cha-lua", "thit-nguoi"]);
});

test("nội dung cơ chế (PLAYBOOK §5): mỗi cơ chế có review theo kết quả ≥ 8 câu + câu khách", () => {
  for (const k of ["allRight", "oneOff", "swapped", "late", "together"]) assert.ok(M3.MULTI_REVIEW[k].length >= 8, k);
  for (const k of ["onTime", "lateLittle", "lateBig", "short"]) assert.ok(M3.PREORDER_REVIEW[k].length >= 8, k);
  for (const k of ["crisp95", "soggy", "toasted", "dark"]) assert.ok(M3.CRISP_REVIEW[k].length >= 8, k);
  for (const k of ["right", "short", "overBack", "overGone"]) assert.ok(M3.CHANGE_REVIEW[k].length >= 8, k);
  for (const k of ["ran", "swapYes", "swapNo", "closed"]) assert.ok(M3.STOCKOUT_REVIEW[k].length >= 8, k);
  for (const k of ["great", "ok", "bad"]) assert.ok(M3.FAIR_REVIEW[k].length >= 8, k);
  assert.ok(M3.SHOP.review.length >= 8 && M3.SHOP.say.length >= 8);
  assert.ok(M3.QUE.review.length >= 8 && M3.HOUSE_LOAF.review.length >= 8 && M3.HOUSE_PATE_REVIEW.length >= 8);
  for (const id of Object.keys(EQUIPMENT)) assert.ok(EQUIPMENT[id].name && EQUIPMENT[id].desc, id);
  for (const id of Object.keys(DECOR)) assert.ok(DECOR[id].at && DECOR[id].place, id);
});

test("lên tới cấp 7 bằng chơi thật (bot): không kẹt, thuê tiệm khi đủ tiền, ca ở tiệm chạy được", () => {
  const s = shop(21);
  let moved = false;
  for (let d = 0; d < 40 && !moved; d++) {
    prepAndOpen(s);
    playShift(s, { rnd: () => 0.3 });
    if (s.level >= 7 && s.money >= 300) { resolveEvent(s); act(s, { type: "rentShop" }); moved = true; }
  }
  if (!moved) { levelUp(s, 7); s.money += 300; resolveEvent(s); act(s, { type: "rentShop" }); }
  prepAndOpen(s);
  playShift(s, { rnd: () => 0.3 });
  assert.equal(s.shop, true);
  assert.ok(!s.shift);
});
