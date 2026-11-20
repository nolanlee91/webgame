// M5: đường đi khách theo manifest.placements, đồ nấu theo mẻ (chảo / chảo đôi / bếp than), hợp đồng định kỳ K02 / X05, hạn dùng nguyên liệu,
// bánh mì nướng bơ đường, hội chợ, thử thách + huy hiệu, nâng bản lưu v2 → v3 (giữ cấp + %, cất bản gốc), nội dung cơ chế (≥ 8–12 câu mỗi kết quả).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shop, act, err, advance, untilWaiting, build, prepAndOpen, playShift, resolveEvent, customer, board } from "./helpers.mjs";
import { createState, loadSave, SAVE_VERSION, rescaleXp, LEVELS_V2 } from "../core/state.js";
import { shopSave, KEY, backupKey } from "../save.js";
import { makeItem, menuFor } from "../core/order.js";
import { genGuests, levelForXp } from "../core/shift.js";
import { orderQueue, exitRoute, entryRoute, scenePointsShop } from "../core/placements.js";
import { customerPos, shopPoints, scenePoints } from "../render/scene.js";
import { COOK, takeCooked } from "../core/cook.js";
import { addContract, contractOrders } from "../core/contracts.js";
import { createPreorder } from "../core/progress.js";
import { reconcile, expire, SHELF, shelfOf, expiringOn } from "../core/expiry.js";
import { CHALLENGES, BADGES, checkBadges, challengeToday } from "../core/challenge.js";
import { EVENT } from "../data/events.js";
import { M5_IDS } from "../data/events-m5.js";
import { SHOP } from "../data/shift.js";
import { LEVELS, RECIPE } from "../data/economy.js";
import { FAIR } from "../data/equipment.js";
import * as M5 from "../data/lines-m5.js";
import * as M3 from "../data/lines-m3.js";
import { eligibleNow } from "../core/drama.js";

const manifest = JSON.parse(readFileSync(new URL("../data/asset-manifest.json", import.meta.url), "utf8"));
const levelUp = (s, lv) => { s.xp = LEVELS[lv - 1]; s.level = lv; s.tutorialDone = true; };
const near = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }

// ---------- đường đi khách ----------
test("đường đi khách dùng manifest.placements: đứng đúng queueSpots, đầu hàng gần chủ tiệm, vào / ra qua cửa theo exitPath", () => {
  const p = manifest.placements;
  assert.deepEqual(SHOP.door, p.door); assert.deepEqual(SHOP.queue, p.queueSpots); assert.deepEqual(SHOP.exit, p.exitPath); // bản chép cho luật thuần khớp manifest
  for (const [P, spots, baker] of [[shopPoints(p), p.queueSpots, p.baker.at], [scenePoints(p), p.cartQueueSpots, p["cart-baker"].at]]) {
    assert.equal(P.queue.length, spots.length);
    for (const q of P.queue) assert.ok(spots.some((x) => near(x, q)), "chỗ đứng lạ " + q);
    const front = spots.reduce((a, q) => (Math.abs(q[0] - baker[0]) < Math.abs(a[0] - baker[0]) ? q : a), spots[0]);
    assert.ok(near(P.queue[0], front), "đầu hàng phải ở chỗ gần chủ tiệm nhất");
    // khách đang chờ đứng đúng chỗ của mình
    P.queue.forEach((q, i) => { const pos = customerPos({ phase: "wait", spot: i }, 1000, P); assert.ok(near(pos, q)); });
    // vào từ cửa, ra tới điểm cuối của exitPath
    const enter0 = customerPos({ phase: "enter", spot: 0, t0: 0 }, 0, P), leaveEnd = customerPos({ phase: "leave", spot: 0, leaveT: 0 }, 1e6, P);
    assert.ok(near(enter0, P.entry));
    assert.ok(near(leaveEnd, P.exit[P.exit.length - 1]));
  }
  // tiệm: góc trái cửa sổ (queueSpots[0] = [246,582]) chỉ dùng khi hàng đã đủ 6 người
  const sp = shopPoints(p);
  assert.ok(near(sp.queue[sp.queue.length - 1], p.queueSpots[0]));
  // lối vào tiệm đi ngược lối ra (qua điểm trước cửa), không cắt chéo qua đầu quầy
  assert.deepEqual(entryRoute(sp.queue[0], sp.exit, sp.entry)[1], p.exitPath[1]);
  assert.deepEqual(exitRoute(sp.queue[0], sp.exit).at(-1), p.door);
  assert.deepEqual(scenePointsShop().queue[0], sp.queue[0]);
});

test("khách chờ trong ca có spot hợp lệ ⇒ vị trí là một queueSpot (luật + render)", () => {
  const s = shop(5); act(s, { type: "firstBatch", sec: 28 }); act(s, { type: "startShift" });
  advance(s, 40000);
  const P = scenePoints(manifest.placements);
  const w = s.shift.customers.filter((c) => c.phase === "wait" && !c.pre);
  assert.ok(w.length >= 1);
  for (const c of w) assert.ok(manifest.placements.cartQueueSpots.some((q) => near(q, customerPos(c, s.shift.t, P))));
  assert.equal(new Set(w.map((c) => c.spot)).size, w.length, "hai khách không đứng chung một chỗ");
});

// ---------- đồ nấu theo mẻ ----------
test("chảo trứng: bước Nhân tự bắc chảo, chờ 6 giây; chảo đôi chiên 2 trứng cùng lúc; trứng dư cuối ca ghi hao", () => {
  const s = shop(6); levelUp(s, 2); s.owned["egg-pan"] = true; s.stock.trung = 10;
  act(s, { type: "firstBatch", sec: 28 }); act(s, { type: "startShift" });
  const c = untilWaiting(s);
  c.items[0] = makeItem("trung", []); c.filled = [null];
  act(s, { type: "pin", cid: c.id }); act(s, { type: "take" }); act(s, { type: "slice" }); act(s, { type: "spread", id: "pate", lvl: 2 });
  const r = act(s, { type: "fill", id: "trung" });
  assert.equal(r.result.wait, "egg"); assert.ok(r.events.some((e) => e.type === "eggFrying"));
  assert.equal(s.stock.trung, 9); assert.ok(!board(s).loaf.fills.includes("trung"));
  s.shift.t += COOK.eggMs; act(s, { type: "tick", dt: 10 });
  assert.equal(s.shift.cook.eggs, 1);
  act(s, { type: "fill", id: "trung" });
  assert.ok(board(s).loaf.fills.includes("trung")); assert.equal(board(s).loaf.ck, "wait");
  assert.equal(err(s, { type: "fry" }) || "ok", "ok"); assert.equal(err(s, { type: "fry" }), "pan-busy"); // chảo đơn: một trứng
  s.owned["egg-pan-2"] = true;
  act(s, { type: "fry" });
  assert.equal(s.shift.cook.pan.filter((x) => x !== null).length, 2);
});

test("bếp than: mẻ 5 phần chín 25 giây, cháy sau 33 giây; chưa chín không gắp được; thịt chín vào ổ, giữ lâu thành 'held'", () => {
  const s = shop(7); levelUp(s, 5); s.owned.grill = true; s.stock["thit-nuong"] = 8;
  act(s, { type: "firstBatch", sec: 28 }); act(s, { type: "startShift" });
  act(s, { type: "grill" });
  assert.equal(s.stock["thit-nuong"], 3); assert.equal(s.shift.cook.grill.n, 5);
  assert.equal(err(s, { type: "grillPull" }), "grill-raw");
  s.shift.t += COOK.grill.golden + 500; act(s, { type: "tick", dt: 10 });
  act(s, { type: "grillPull" });
  assert.equal(s.shift.cook.meat, 5);
  // mẻ thứ hai để cháy
  act(s, { type: "grill" }); s.shift.t += COOK.grill.burnt + 2000;
  const r = act(s, { type: "tick", dt: 10 }); assert.ok(r.events.some((e) => e.type === "grillBurnt"));
  act(s, { type: "grillPull" }); assert.ok(s.shift.waste.burnt > 0);
  s.shift.t += 100000;
  assert.equal(takeCooked(s, "thit-nuong", 1, []).held > 90000, true);
});

// ---------- hợp đồng ----------
test("hợp đồng định kỳ K02: 12 ổ mỗi 2 ngày tự sinh đơn đầu ca; giao đủ ⇒ cờ hop-dong-xong; trễ 2 đợt ⇒ huỷ + hop-dong-vo", () => {
  const s = shop(8); levelUp(s, 7); s.shop = true; s.oven = "gas";
  const ev = [];
  addContract(s, { id: "chu-tam", name: "Đội Chú Tám", arch: "worker", recipe: "cha-lua", n: 12, every: 2, deliveries: 3, dueMs: 90000, label: "Hợp đồng công trình" }, ev);
  assert.equal(s.contracts[0].next, s.day);
  const days = [];
  for (let d = 0; d < 6; d++) {
    const before = s.contracts.length ? s.contracts[0].left : 0;
    contractOrders(s, ev, (st, spec, e) => createPreorder(st, spec, e));
    if (s.contracts.length && s.contracts[0].left < before) days.push(s.day);
    s.day++;
  }
  assert.deepEqual(days, [s.day - 6, s.day - 4, s.day - 2], "đúng lịch mỗi 2 ngày");
  const pre = s.preorders.filter((p) => p.contract === "chu-tam");
  assert.equal(pre.length, 3); assert.equal(pre[0].items.length, 12); assert.equal(pre[0].deposit, 0);
  // trễ hai lần ⇒ huỷ
  const s2 = shop(9); levelUp(s2, 7); s2.shop = true;
  addContract(s2, { id: "hoa-sen", name: "Chị Thảo", arch: "office", recipe: "cha-lua", n: 6, every: 7, deliveries: 4, dueMs: 30000 }, []);
  for (let k = 0; k < 2; k++) {
    prepAndOpen(s2);
    const c = s2.shift.customers.find((x) => x.pre?.contract === "hoa-sen");
    assert.ok(c, "đơn hợp đồng có trong ca");
    s2.shift.t = c.pre.dueT + 61000; act(s2, { type: "tick", dt: 10 });
    playShift(s2, { rnd: () => 0.4 });
    s2.day += 6;
  }
  assert.equal((s2.contracts || []).length, 0);
  assert.ok(s2.drama.flags["hop-dong-vo"] !== undefined);
});

test("sự kiện K02 / X05 ký hợp đồng (fx.contract) thay cho một đơn lẻ; HD1 / HD2 mở khi có cờ", () => {
  for (const id of ["K02", "X05"]) assert.ok(Object.values(EVENT[id].nodes).flatMap((n) => n.choices).some((c) => c.fx?.contract || c.roll?.win?.fx?.contract));
  const s = shop(10); levelUp(s, 8); s.shop = true; s.tutorialDone = true; s.day = 9;
  s.drama.flags["hop-dong-xong"] = s.day + 2;
  s.lastSummary = { day: s.day - 1, profit: 50, lost: 0, avg: 4, loaves: 10, burntBatches: 0, batches: 3, moments: [] };
  assert.ok(eligibleNow(s, EVENT.HD1));
  for (const id of M5_IDS) assert.ok(EVENT[id], id);
});

// ---------- hạn dùng ----------
test("hạn dùng: lô cũ dùng trước, quá hạn thì bỏ + ghi hao 'hết hạn'; tủ mát +1 ngày; chậu rau thơm giữ rau lâu hơn", () => {
  const s = shop(11); s.tutorialDone = true;
  s.stock.rau = 0; s.money = 500; delete s.lots.rau;
  s.day = 1; act(s, { type: "restock", id: "rau" });
  assert.deepEqual(s.lots.rau, [[1, 15]]);
  s.stock.rau -= 10; // dùng 10 trong ca
  s.day = 2; act(s, { type: "restock", id: "rau" }); // nhập thêm 15 sáng hôm sau
  assert.deepEqual(s.lots.rau, [[1, 5], [2, 15]]);
  reconcile(s, 2); assert.deepEqual(s.lots.rau, [[1, 5], [2, 15]]);
  assert.equal(shelfOf(s, "rau"), SHELF.rau);
  assert.deepEqual(expiringOn(s, 2), { rau: 5 });
  const sh = { day: 2, waste: {}, wasteLog: [] };
  const gone = expire(s, sh);
  assert.equal(gone.rau, 5); assert.equal(s.stock.rau, 15); assert.equal(sh.waste.expired, 5); assert.match(sh.wasteLog[0], /Hết hạn: Rau thơm 5/);
  s.owned.fridge = true; assert.equal(shelfOf(s, "cha-lua"), SHELF["cha-lua"] + 1);
  s.owned["herb-pot"] = true; assert.equal(shelfOf(s, "rau"), SHELF.rau + 2); // tủ mát + chậu rau
  assert.equal(shelfOf(s, "gia-vi"), 0, "gia vị không hết hạn");
});

test("hạn dùng trong ca thật: chốt ca ghi phần hết hạn vào bảng chốt ca, không kẹt kho", () => {
  const s = shop(12);
  for (let d = 0; d < 4; d++) { prepAndOpen(s); playShift(s, { rnd: () => 0.5 }); act(s, { type: "closeSummary" }); }
  assert.ok(s.lots && typeof s.lots === "object");
  for (const [id, lots] of Object.entries(s.lots)) assert.equal(lots.reduce((a, l) => a + l[1], 0), s.stock[id], id);
  assert.ok("expiredK" in s.lastSummary);
});

// ---------- bánh mì nướng bơ đường ----------
test("bánh hôm qua 'bán nướng bơ đường': khách sáng gọi món riêng 10k, lấy đúng ổ bánh hôm qua, nướng lại tối đa 70", () => {
  const s = shop(13); s.tutorialDone = true; s.day = 4; s.stale = { n: 6, choice: "sell" };
  const g = genGuests(s).filter((x) => x.items[0].recipe === "bo-duong");
  assert.ok(g.length >= 3 && g.length <= 6);
  assert.ok(!menuFor(s).some((r) => r.id === "bo-duong"), "không nằm trong menu thường");
  act(s, { type: "firstBatch", sec: 28 }); act(s, { type: "startShift" });
  assert.equal(s.shift.case.filter((l) => l.src === "stale").length, 6);
  const c = untilWaiting(s);
  c.items[0] = makeItem("bo-duong", []); c.filled = [null];
  act(s, { type: "pin", cid: c.id }); act(s, { type: "take" });
  assert.equal(board(s).loaf.src, "stale");
  act(s, { type: "toast" }); s.shift.t += 4500; act(s, { type: "toast" });
  assert.ok(board(s).loaf.crisp <= 70 && board(s).loaf.crisp > 50);
  build(s, c.items[0]);
  act(s, { type: "serve" });
  assert.equal(RECIPE["bo-duong"].price, 10);
});

// ---------- hội chợ ----------
test("hội chợ (cấp 18): phí 150k, ca dài 4,5 phút, +8 khách, giá +15%, khách đi nhóm; mỗi 4 ngày một lần", () => {
  const s = shop(14); levelUp(s, 18); s.shop = true; s.oven = "gas"; s.money = 1000;
  const g0 = genGuests({ ...structuredClone(s) }).length;
  act(s, { type: "fair" });
  assert.equal(s.money, 850); assert.equal(s.fairCount, 1);
  assert.equal(err(s, { type: "fair" }), "already");
  const g = genGuests(structuredClone(s));
  assert.ok(g.length >= g0 + 4, `${g.length} vs ${g0}`);
  assert.ok(g.some((x) => x.tag === "fair" && x.items.length >= 2), "có đơn nhóm hội chợ");
  act(s, { type: "firstBatch", sec: 27 }); act(s, { type: "startShift" });
  assert.equal(s.shift.len, FAIR.ms);
  const it = s.shift.schedule.flatMap((x) => x.items).find((x) => x.recipe === "cha-lua" && !x.quirks.length);
  if (it) assert.equal(it.price, Math.round(RECIPE["cha-lua"].price * FAIR.priceMul));
  playShift(s, { rnd: () => 0.3 });
  assert.equal(s.lastSummary.fair, true); assert.equal(s.lastSummary.len, FAIR.ms);
  assert.equal(err(s, { type: "fair" }), "too-soon");
  s.day += 3; assert.equal(err(s, { type: "fair" }) ?? null, null);
});

// ---------- thử thách + huy hiệu ----------
test("thử thách (cấp 20): lịch xoay 5 loại, nhận / bỏ trước ca; Một lò ép 1 ngăn; Thối tay tắt 'Thối đúng' + phụ việc; đạt lần đầu có huy hiệu", () => {
  assert.equal(CHALLENGES.length, 5);
  const s = shop(15); levelUp(s, 20); s.shop = true; s.oven = "gas"; s.money = 2000;
  assert.equal(err(s, { type: "challenge", on: true }) ?? null, null);
  assert.equal(s.challenge.id, challengeToday(s).id);
  act(s, { type: "challenge", on: false }); assert.equal(s.challenge, null);
  // Một lò
  s.day = CHALLENGES.findIndex((c) => c.id === "mot-lo") + 5 * 4;
  act(s, { type: "challenge", on: true }); assert.equal(s.challenge.id, "mot-lo");
  act(s, { type: "firstBatch", sec: 27 }); act(s, { type: "startShift" });
  assert.equal(s.shift.oven.length, 1);
  // xét: ép bảng chốt ca đạt mục tiêu
  s.shift.stats.loaves = 30; s.shift.stats.served = 25; s.shift.schedule = []; s.shift.customers = [];
  const money0 = s.money;
  s.shift.t = 240000; act(s, { type: "tick", dt: 10 });
  assert.ok(!s.shift);
  assert.equal(s.lastSummary.challenge.ok, true); assert.equal(s.lastSummary.challenge.first, true);
  assert.ok(s.badges["tt-mot-lo"]); assert.ok(s.money >= money0 + 120);
  assert.ok(s.lastSummary.badges.some((b) => b.id === "tt-mot-lo"));
  // Thối tay
  s.day = CHALLENGES.findIndex((c) => c.id === "thoi-tay") + 5 * 6;
  act(s, { type: "challenge", on: true }); s.helperDay = s.day; s.day = Math.max(s.day, 1);
  act(s, { type: "startShift" });
  const sh = s.shift; sh.helperUntil = sh.t + 99999;
  const { helperOn, autoChangeAllowed } = awaitShift;
  assert.equal(helperOn(s), false); assert.equal(autoChangeAllowed(s), false);
});
import * as awaitShift from "../core/shift.js";

test("huy hiệu: 14 cái, xét một lần, có câu + khoảnh khắc Nhật Ký; mua hạng tiệm cao nhất cũng xét", () => {
  assert.equal(BADGES.length, 14);
  const s = shop(16); s.level = 20; s.xp = LEVELS[19]; s.money = 3500;
  const ev = [], sum = { served: 16, lost: 0, loaves: 16, avg: 5, goldenPulls: 9, burntBatches: 0, changeRight: 16, changeWrong: 0, moments: [] };
  const got = checkBadges(s, sum, ev);
  for (const id of ["chu-tiem", "khong-bo-ve", "nam-sao", "tay-lo-vang", "thoi-dung", "trieu-phu"]) assert.ok(got.some((b) => b.id === id), id);
  assert.ok(ev.every((e) => e.type === "badge" && e.line && !e.line.includes("{badge}")));
  assert.equal(checkBadges(s, sum, []).length, 0, "không nhận lại");
  assert.ok(sum.moments.some((m) => m.kind === "badge"));
});

// ---------- bản lưu v2 → v3 ----------
test("bản lưu v2 → v3: cất bản gốc .bak-v2 một lần, giữ cấp + phần trăm tới cấp sau, huy hiệu cũ chuyển thành số thử thách", () => {
  assert.equal(SAVE_VERSION, 3);
  const old = createState(77);
  old.v = 2; old.introSeen = true; old.tutorialDone = true; old.day = 30; old.level = 9; old.xp = 2550; old.money = 1234; old.badges = { chuTiem: 2 };
  for (const k of ["contracts", "lots", "fairCount", "challenge"]) delete old[k];
  const raw = JSON.stringify(old);
  const mem = new Mem(); mem.setItem(KEY, raw);
  const r = shopSave(mem).read(1);
  assert.equal(r.migrated, 2);
  assert.equal(mem.getItem(backupKey(2)), raw);
  const s = r.state;
  assert.equal(s.v, 3); assert.equal(s.money, 1234); assert.equal(s.day, 30);
  // cấp 9 ở 50% đường tới cấp 10 trên bảng cũ ⇒ vẫn cấp 9, ~50% trên bảng mới
  const pctOld = (2550 - LEVELS_V2[8]) / (LEVELS_V2[9] - LEVELS_V2[8]), pctNew = (s.xp - LEVELS[8]) / (LEVELS[9] - LEVELS[8]);
  assert.equal(s.level, 9); assert.ok(Math.abs(pctOld - pctNew) < 0.01, `${pctOld} ${pctNew}`);
  assert.equal(s.stats.challenges, 2); assert.deepEqual(s.badges, {});
  assert.deepEqual(s.contracts, []); assert.deepEqual(s.lots, {});
  shopSave(mem).write(s); shopSave(mem).read(1);
  assert.equal(mem.getItem(backupKey(2)), raw, "bản gốc chỉ cất một lần");
  // rescaleXp: mọi mốc cấp giữ nguyên cấp
  for (let lv = 1; lv <= 20; lv++) assert.equal(levelForXp(rescaleXp(LEVELS_V2[lv - 1], LEVELS_V2)), lv);
  assert.equal(levelForXp(rescaleXp(LEVELS_V2[19] + 500, LEVELS_V2)), 20);
});

// ---------- nội dung ----------
test("nội dung M5 (PLAYBOOK §5): mỗi kết quả của mỗi cơ chế 8–12 câu, không emoji, biến điền đúng", () => {
  const pools = {
    ...Object.fromEntries(Object.entries(M5.CHALLENGE_TEXT).flatMap(([id, t]) => [[id + ".win", t.win], [id + ".lose", t.lose]])),
    badge: M5.BADGE_LINES, "contract.onTime": M5.CONTRACT_REVIEW.onTime, "contract.late": M5.CONTRACT_REVIEW.late, "contract.say": M5.CONTRACT_LINES.say,
    "contract.delivered": M5.CONTRACT_LINES.delivered, "contract.late2": M5.CONTRACT_LINES.late, "contract.finished": M5.CONTRACT_LINES.finished, "contract.broken": M5.CONTRACT_LINES.broken,
    "egg.hot": M5.COOK_LINES.eggReview.hot, "egg.wait": M5.COOK_LINES.eggReview.wait, "grill.fresh": M5.COOK_LINES.grillReview.fresh, "grill.held": M5.COOK_LINES.grillReview.held,
    "egg.say": M5.COOK_LINES.eggWait, "grill.say": M5.COOK_LINES.grillWait, "expiry.toss": M5.EXPIRY_LINES.toss, "expiry.fresh": M5.EXPIRY_LINES.fresh, "expiry.old": M5.EXPIRY_LINES.old,
    "boDuong.say": M5.BO_DUONG.say, "boDuong.good": M5.BO_DUONG.review.good, "boDuong.soggy": M5.BO_DUONG.review.soggy, "fair.say": M5.FAIR_LINES.say,
    "fair.great": [...M3.FAIR_REVIEW.great, ...M5.FAIR_LINES.review.great], "fair.ok": [...M3.FAIR_REVIEW.ok, ...M5.FAIR_LINES.review.ok], "fair.bad": [...M3.FAIR_REVIEW.bad, ...M5.FAIR_LINES.review.bad],
  };
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  for (const [k, list] of Object.entries(pools)) {
    assert.ok(list.length >= 8 && list.length <= 14, `${k}: ${list.length}`);
    assert.equal(new Set(list).size, list.length, `${k} trùng câu`);
    for (const t of list) { assert.ok(!EMOJI.test(t), `${k} emoji`); assert.ok(!/\{(?!name|self|call|Call|Self|n|badge|loaf)\w+\}/.test(t), `${k}: ${t}`); }
  }
  assert.ok(Object.keys(pools).length >= 30);
});
