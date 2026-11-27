// Test luật xây dựng (Milestone 3) — core/build.js + data/buildings.js. Không phụ thuộc apply/state (đang sửa song song).
import test from "node:test";
import assert from "node:assert/strict";
import * as B from "../core/build.js?v=m15";
import { BUILDING, BUILDINGS, DECOR, DECOR_SLOTS, DECOR_BAG_MAX, maxLevel } from "../data/buildings.js?v=m15";
import { WAREHOUSE } from "../data/warehouse.js?v=m15";
import { featureLevel } from "../data/levels.js?v=m15";
import { MACHINE } from "../data/machines.js?v=m15";

const T0 = 1_000_000;
const MIN = 60_000, HOUR = 3_600_000;
const MATS = ["van-go", "hop-dinh", "thung-son"];

function wallet(coins = 0) {
  const w = { n: coins, coins: () => w.n, spend(k) { if (!Number.isFinite(k) || k < 0 || w.n < k) return false; w.n -= k; return true; }, earn(k) { w.n += k; } };
  return w;
}
function inv(start = {}) {
  const bag = { ...start };
  return {
    bag,
    count: (id) => bag[id] || 0,
    has: (id, n = 1) => Number.isInteger(n) && n >= 0 && (bag[id] || 0) >= n,
    take(id, n = 1) { if (!Number.isInteger(n) || n <= 0 || (bag[id] || 0) < n) return false; bag[id] -= n; if (!bag[id]) delete bag[id]; return true; },
    add(id, n = 1) { if (!Number.isInteger(n) || n <= 0) return { ok: false, overflow: 0 }; bag[id] = (bag[id] || 0) + n; return { ok: true, overflow: 0 }; },
  };
}
const rich = () => [wallet(1e9), inv({ "van-go": 999, "hop-dinh": 999, "thung-son": 999 })];
const snap = (...xs) => JSON.stringify(xs);

test("dữ liệu: cấp mở khớp data/levels.js và §3", () => {
  const exp = { "nha-kho": 3, "xuong": 4, "coi-xay-gio": 5, "bien-lang": 6, "chuong-ga": 7, "chuong-bo": 9, "nha-kinh": 10, "xe-giao-hang": 11, "dat-phia-dong": 17 };
  for (const [id, lv] of Object.entries(exp)) assert.equal(BUILDING[id].levels[0].unlock, lv, id);
  assert.equal(BUILDING["xuong"].levels[1].unlock, 13);
  assert.equal(BUILDING["nha-kho"].levels[3].unlock, 15);
  assert.equal(BUILDING["nha-kho"].levels[4].unlock, 18);
  // §3 giá / thời gian
  assert.deepEqual([BUILDING["nha-kho"].levels[0].cost, BUILDING["nha-kho"].levels[0].ms], [60, 0]);
  assert.deepEqual([BUILDING["xuong"].levels[0].cost, BUILDING["xuong"].levels[0].ms], [150, MIN]);
  assert.deepEqual([BUILDING["chuong-ga"].levels[0].cost, BUILDING["chuong-ga"].levels[0].ms], [300, 2 * MIN]);
  assert.deepEqual([BUILDING["chuong-bo"].levels[0].cost, BUILDING["chuong-bo"].levels[0].ms], [600, 3 * MIN]);
  assert.deepEqual([BUILDING["nha-kinh"].levels[0].cost, BUILDING["nha-kinh"].levels[0].ms, BUILDING["nha-kinh"].levels[0].materials], [900, 5 * MIN, { "van-go": 4 }]); // M3: 10 → 4 (tools/sim gợi ý 5)
  assert.equal(BUILDING["coi-xay-gio"].machine, "coi-xay");
  assert.ok(MACHINE["coi-xay"]);
  for (const d of BUILDINGS) {
    let prev = 0;
    for (const s of d.levels) {
      assert.ok(s.unlock >= prev, `${d.id} unlock không giảm`); prev = s.unlock;
      assert.ok(s.ms >= 0 && s.ms <= 5 * MIN, `${d.id} thời gian 0..5 ph`);
      if (d.size === "small" && d.kind !== "auto") assert.equal(s.ms, 0, `${d.id} nhỏ ⇒ tức thì`);
      for (const m of Object.keys(s.materials)) assert.ok(MATS.includes(m), `${d.id} vật liệu ${m}`);
    }
    assert.ok(d.y > 0 && d.y <= 1 && d.x > 0 && d.x < 1.5, `${d.id} toạ độ`);
  }
});

test("trạng thái: locked → available → building → done → upgradeable", () => {
  const b = B.createBuild(); const [w, i] = rich(); const id = "chuong-ga";
  assert.equal(B.buildingStatus(b, id, T0, 6), "locked");
  assert.equal(B.startBuild(b, w, i, id, T0, { level: 6 }).err, "locked");
  assert.equal(B.buildingStatus(b, id, T0, 7), "available");
  const r = B.startBuild(b, w, i, id, T0, { level: 7 });
  assert.ok(r.ok); assert.equal(r.instant, false); assert.equal(r.readyAt, T0 + 2 * MIN);
  assert.deepEqual(b.buildings[id], { level: 0, done: false, startAt: T0, readyAt: T0 + 2 * MIN });
  assert.equal(B.buildingStatus(b, id, T0 + 2 * MIN - 1, 7), "building");
  assert.equal(B.isBuilt(b, id, T0 + 2 * MIN - 1), false);
  assert.equal(B.effects(b, T0 + 2 * MIN - 1).chickenCap, 0);
  const t1 = T0 + 2 * MIN;
  assert.equal(B.buildingStatus(b, id, t1, 7), "done");
  assert.equal(B.buildingStatus(b, id, t1, 10), "upgradeable");
  assert.deepEqual(B.tick(b, t1), [{ id, level: 1, at: t1 }]);
  assert.deepEqual(B.tick(b, t1), []); // không báo xong 2 lần
  assert.equal(b.buildings[id].done, true);
  assert.equal(B.startUpgrade(b, w, i, id, t1, { level: 9 }).err, "locked");
  const u = B.startUpgrade(b, w, i, id, t1, { level: 10 });
  assert.ok(u.ok && !u.instant); assert.equal(B.buildingStatus(b, id, t1 + 1, 10), "building");
  assert.equal(B.effects(b, t1 + 1).chickenCap, 6, "đang nâng: vẫn level cũ");
  assert.equal(B.isBuilt(b, id, t1 + 1), true, "đang nâng vẫn dùng được");
  assert.equal(B.startUpgrade(b, w, i, id, t1 + 1, { level: 10 }).err, "building");
  const t2 = u.readyAt;
  assert.equal(B.effects(b, t2).chickenCap, 8);
  assert.equal(B.buildingStatus(b, id, t2, 10), "done");
  assert.equal(B.buildingStatus(b, id, t2, 14), "upgradeable");
  const u2 = B.startUpgrade(b, w, i, id, t2, { level: 14 }); // nâng tiếp khi chưa tick: tự tính level đã xong
  assert.ok(u2.ok); assert.equal(u2.level, 3);
  const t3 = u2.readyAt;
  assert.equal(B.buildingStatus(b, id, t3, 20), "done");
  assert.equal(B.startUpgrade(b, w, i, id, t3, { level: 20 }).err, "max");
  assert.equal(B.startBuild(b, w, i, id, t3, { level: 20 }).err, "built");
  assert.equal(B.levelOf(b, id, t3), 3);
});

test("offline: nhảy nhiều giờ ⇒ xong đúng, không xong trước readyAt", () => {
  const b = B.createBuild(); const [w, i] = rich();
  B.startBuild(b, w, i, "nha-kinh", T0, { level: 10 });
  B.startBuild(b, w, i, "chuong-bo", T0, { level: 10 });
  assert.deepEqual(B.tick(b, T0 + 5 * MIN - 1).map((x) => x.id), ["chuong-bo"]);
  assert.equal(B.effects(b, T0 + 5 * MIN - 1).greenhousePlots, 0);
  const later = T0 + 7 * HOUR;
  assert.equal(B.effects(b, later).greenhousePlots, 6, "effects suy từ thời gian kể cả chưa tick");
  assert.equal(B.effects(b, later).greenhouseNoWater, true);
  assert.deepEqual(B.tick(b, later), [{ id: "nha-kinh", level: 1, at: T0 + 5 * MIN }]);
  assert.equal(b.buildings["nha-kinh"].level, 1);
});

test("xây tức thì: Nhà kho xong ngay, nâng kho tức thì", () => {
  const b = B.createBuild(); const w = wallet(60), i = inv();
  const r = B.startBuild(b, w, i, "nha-kho", T0, { level: 3 });
  assert.ok(r.ok && r.instant); assert.equal(w.n, 0);
  assert.deepEqual(b.buildings["nha-kho"], { level: 1, done: true, startAt: T0, readyAt: T0 });
  assert.equal(B.buildingStatus(b, "nha-kho", T0, 3), "upgradeable");
  assert.deepEqual(B.tick(b, T0), []);
});

test("không trừ 2 lần; thiếu xu / vật liệu ⇒ từ chối, không đổi gì", () => {
  const b = B.createBuild(); const w = wallet(1000), i = inv({ "van-go": 3 });
  assert.equal(B.startBuild(b, w, i, "nha-kinh", T0, { level: 10 }).err, "materials");
  assert.equal(snap(b, w.n, i.bag), snap(B.createBuild(), 1000, { "van-go": 3 }));
  i.add("van-go", 1); w.n = 899;
  assert.equal(B.startBuild(b, w, i, "nha-kinh", T0, { level: 10 }).err, "coins");
  assert.equal(snap(b, w.n, i.bag), snap(B.createBuild(), 899, { "van-go": 4 }));
  w.n = 1000;
  assert.ok(B.startBuild(b, w, i, "nha-kinh", T0, { level: 10 }).ok);
  assert.equal(w.n, 100); assert.deepEqual(i.bag, {});
  for (const t of [T0, T0 + 1, T0 + HOUR]) {
    const before = snap(b, w.n, i.bag);
    assert.ok(B.startBuild(b, w, i, "nha-kinh", t, { level: 10 }).err);
    assert.equal(snap(b, w.n, i.bag), before);
  }
  // ví từ chối dù coins() báo đủ ⇒ hoàn vật liệu
  const b2 = B.createBuild(), liar = { coins: () => 1e9, spend: () => false, earn() {} }, i2 = inv({ "van-go": 4 });
  assert.equal(B.startBuild(b2, liar, i2, "nha-kinh", T0, { level: 10 }).err, "coins");
  assert.deepEqual(i2.bag, { "van-go": 4 }); assert.deepEqual(b2.buildings, {});
  // kho từ chối giữa chừng ⇒ hoàn phần đã lấy
  const b3 = B.createBuild(), w3 = wallet(1e6), i3 = inv({ "van-go": 99, "hop-dinh": 99 });
  B.startBuild(b3, w3, i3, "chuong-ga", T0, { level: 13 });
  const flaky = { ...i3, take: (id, n) => (id === "hop-dinh" ? false : i3.take(id, n)) };
  assert.equal(B.startUpgrade(b3, w3, flaky, "chuong-ga", T0 + 2 * MIN, { level: 13 }).err, "materials");
  assert.deepEqual(i3.bag, { "van-go": 99, "hop-dinh": 99 }); assert.equal(w3.n, 1e6 - 300);
});

test("nhà kho: các mốc khớp data/warehouse.js", () => {
  const b = B.createBuild(); const [w, i] = rich();
  assert.equal(B.effects(b).warehouseCap, WAREHOUSE[0].cap, "chưa xây = kho tạm 60");
  B.startBuild(b, w, i, "nha-kho", T0, { level: 3 });
  assert.equal(B.effects(b).warehouseCap, WAREHOUSE[0].cap);
  assert.equal(maxLevel("nha-kho"), WAREHOUSE.length);
  for (let t = 1; t < WAREHOUSE.length; t++) {
    const step = BUILDING["nha-kho"].levels[t];
    assert.equal(step.cost, WAREHOUSE[t].cost); assert.deepEqual({ ...step.materials }, WAREHOUSE[t].materials);
    assert.equal(B.startUpgrade(b, w, i, "nha-kho", T0, { level: step.unlock - 1 }).err, "locked");
    const coins = w.n, r = B.startUpgrade(b, w, i, "nha-kho", T0, { level: step.unlock });
    assert.ok(r.ok && r.instant); assert.equal(coins - w.n, WAREHOUSE[t].cost);
    assert.equal(B.effects(b).warehouseTier, t); assert.equal(B.effects(b).warehouseCap, WAREHOUSE[t].cap);
  }
  assert.equal(B.effects(b).warehouseCap, 320, "Milestone 5: mốc cuối 320");
  assert.equal(B.startUpgrade(b, w, i, "nha-kho", T0, { level: 20 }).err, "max");
  assert.equal(B.levelOf(b, "nha-kho", T0), 6);
});

test("xưởng cấp 2 ⇒ +1 ô hàng chờ; chuồng / nhà kính / đất phía Đông", () => {
  const b = B.createBuild(); const [w, i] = rich(); let t = T0;
  const go = (id, up = false, lv = 20) => { const r = (up ? B.startUpgrade : B.startBuild)(b, w, i, id, t, { level: lv }); assert.ok(r.ok, id + " " + r.err); t = r.readyAt; B.tick(b, t); };
  go("xuong"); assert.equal(B.effects(b, t).extraQueueSlots, 0); assert.equal(B.effects(b, t).workshopLevel, 1);
  assert.equal(B.startUpgrade(b, w, i, "xuong", t, { level: 12 }).err, "locked");
  go("xuong", true, 13); assert.equal(B.effects(b, t).extraQueueSlots, 1); assert.equal(B.effects(b, t).workshopLevel, 2);
  go("chuong-ga"); assert.equal(B.effects(b, t).chickenCap, 6);
  go("chuong-ga", true); assert.equal(B.effects(b, t).chickenCap, 8);
  go("chuong-ga", true); assert.equal(B.effects(b, t).chickenCap, 10);
  go("chuong-bo"); assert.equal(B.effects(b, t).cowCap, 4);
  go("chuong-bo", true); assert.equal(B.effects(b, t).cowCap, 6);
  go("nha-kinh"); assert.equal(B.effects(b, t).greenhousePlots, 6);
  go("nha-kinh", true); assert.equal(B.effects(b, t).greenhousePlots, 9);
  assert.equal(B.effects(b, t).eastOpen, false);
  assert.equal(B.startBuild(b, w, i, "dat-phia-dong", t, { level: 16 }).err, "locked");
  go("dat-phia-dong", false, 17);
  const e = B.effects(b, t);
  assert.deepEqual([e.eastOpen, e.eastPlots, e.eastLots], [true, 9, 1]);
  assert.ok(B.builtIds(b, t).includes("nha-kinh"));
  assert.ok(B.builtIds(b, t, 11).includes("xe-giao-hang"));
  assert.ok(!B.builtIds(b, t, 10).includes("xe-giao-hang"));
  assert.ok(B.builtIds(b, t).includes("nha") && B.builtIds(b, t).includes("sap-cho"));
});

test("loại không xây bằng build.js: auto, machine; prebuilt chỉ nâng", () => {
  const b = B.createBuild(); const [w, i] = rich();
  for (const id of ["bien-lang", "xe-giao-hang", "coi-xay-gio", "nha", "sap-cho"]) assert.equal(B.startBuild(b, w, i, id, T0, { level: 20 }).err, "not-buildable", id);
  assert.equal(B.startUpgrade(b, w, i, "coi-xay-gio", T0, { level: 20 }).err, "not-buildable");
  assert.equal(B.buildingStatus(b, "coi-xay-gio", T0, 5), "available");
  assert.equal(B.buildingStatus(b, "coi-xay-gio", T0, 5, { production: { machines: { "coi-xay": { readyAt: T0 + 5 } } } }), "building");
  assert.equal(B.buildingStatus(b, "coi-xay-gio", T0 + 5, 5, { production: { machines: { "coi-xay": { readyAt: T0 + 5 } } } }), "done");
  assert.equal(B.buildingStatus(b, "bien-lang", T0, 5), "locked");
  assert.equal(B.buildingStatus(b, "bien-lang", T0, 6), "done");
  assert.equal(B.buildingStatus(b, "sap-cho", T0, 2), "done");
  assert.equal(B.buildingStatus(b, "sap-cho", T0, 3), "upgradeable");
  assert.equal(B.effects(b).marketFull, false);
  const coins = w.n;
  assert.ok(B.startUpgrade(b, w, i, "sap-cho", T0, { level: 3 }).instant);
  assert.equal(coins - w.n, 50); assert.equal(B.effects(b).marketFull, true);
  assert.equal(B.buildingStatus(b, "sap-cho", T0, 20), "done");
});

test("trang trí: túi riêng, ô, cỡ, cấp, đất phía Đông", () => {
  const b = B.createBuild(); const ctx = { level: 19 };
  assert.equal(B.placeDecor(b, "chau-hoa", "hien-nha", T0, ctx).err, "no-decor");
  assert.ok(B.addDecor(b, "chau-hoa", 2).ok);
  assert.equal(B.placeDecor(b, "chau-hoa", "hien-nha", T0, { level: 2 }).err, "locked");
  assert.ok(B.placeDecor(b, "chau-hoa", "hien-nha", T0, ctx).ok);
  assert.equal(B.placeDecor(b, "chau-hoa", "hien-nha", T0, ctx).err, "slot-taken");
  assert.equal(B.placeDecor(b, "chau-hoa", "khong-co", T0, ctx).err, "bad");
  assert.deepEqual(b.decor, { "chau-hoa": 1 });
  B.addDecor(b, "cong-tre", 1);
  assert.equal(B.placeDecor(b, "cong-tre", "cong", T0, { level: 18 }).err, "locked", "đồ hiếm cấp 19");
  assert.equal(B.placeDecor(b, "cong-tre", "goc-ruong-tl", T0, ctx).err, "slot-size");
  assert.ok(B.placeDecor(b, "cong-tre", "cong", T0, ctx).ok);
  assert.ok(B.placeDecor(b, "chau-hoa", "cong", T0, ctx).err);
  assert.equal(B.placeDecor(b, "chau-hoa", "dong-2", T0, ctx).err, "slot", "chưa mở đất phía Đông");
  assert.ok(B.removeDecor(b, "cong").ok);
  assert.equal(B.removeDecor(b, "cong").err, "slot-empty");
  assert.deepEqual(b.decor, { "chau-hoa": 1, "cong-tre": 1 });
  assert.deepEqual(b.decorPlaced, [{ id: "chau-hoa", slot: "hien-nha" }]);
  assert.equal(B.addDecor(b, "khong-co").err, "bad");
  assert.equal(B.addDecor(b, "chau-hoa", DECOR_BAG_MAX).err, "bag-full");
  assert.equal(B.addDecor(b, "chau-hoa", 0).err, "bad");
  // mở đất phía Đông ⇒ ô phía Đông dùng được
  const [w, i] = rich();
  const r = B.startBuild(b, w, i, "dat-phia-dong", T0, { level: 17 });
  assert.ok(B.placeDecor(b, "chau-hoa", "dong-2", r.readyAt, ctx).ok);
  assert.ok(DECOR.length === 8 && DECOR_SLOTS.length >= 8);
});

test("sanitize: kẹp rác + đọc bản ghi Xưởng của M2", () => {
  const now = T0 + HOUR;
  assert.deepEqual(B.sanitize(null, now), B.createBuild());
  assert.deepEqual(B.sanitize("x", now), B.createBuild());
  const raw = {
    buildings: {
      "nha-kho": { level: 99, done: true, startAt: 0, readyAt: now + 9e9 },
      "chuong-ga": { level: 0, done: false, startAt: -5, readyAt: now + 9e9 },
      "chuong-bo": { level: "x", done: false, startAt: 1, readyAt: NaN },
      "nha-kinh": { level: 2, done: false, startAt: 0, readyAt: 1 },
      "dat-phia-dong": { level: 0, done: true, startAt: 0, readyAt: 0 },
      "bien-lang": { level: 1, done: true }, "coi-xay-gio": { level: 1 }, hack: { level: 3 }, __proto__x: 1,
      "sap-cho": { level: 1, done: false, startAt: now, readyAt: now + 5 },
    },
    decorPlaced: [{ id: "chau-hoa", slot: "hien-nha" }, { id: "ghe-tre", slot: "hien-nha" }, { id: "cong-tre", slot: "goc-ruong-tl" }, { id: "x", slot: "cong" }, null, { id: "gieng-da", slot: "san-kho" }],
    decor: { "chau-hoa": 3.7, "ghe-tre": -2, x: 5, "den-long": 1e9, "co-lau": "7" },
  };
  const s = B.sanitize(raw, now);
  assert.deepEqual(s.buildings["nha-kho"], { level: WAREHOUSE.length, done: true, startAt: now, readyAt: now });
  assert.deepEqual(s.buildings["chuong-ga"], { level: 0, done: false, startAt: now, readyAt: now + 2 * MIN });
  assert.deepEqual(s.buildings["chuong-bo"], { level: 0, done: false, startAt: now - 3 * MIN, readyAt: now });
  assert.deepEqual(s.buildings["nha-kinh"], { level: 2, done: true, startAt: 1, readyAt: 1 });
  assert.equal(s.buildings["dat-phia-dong"], undefined);
  assert.deepEqual(s.buildings["sap-cho"], { level: 2, done: true, startAt: now, readyAt: now }, "mốc tức thì không thể đang xây");
  for (const k of ["bien-lang", "coi-xay-gio", "hack", "__proto__x"]) assert.equal(s.buildings[k], undefined);
  assert.deepEqual(s.decorPlaced, [{ id: "chau-hoa", slot: "hien-nha" }, { id: "gieng-da", slot: "san-kho" }]);
  assert.deepEqual(s.decor, { "chau-hoa": 3, "den-long": DECOR_BAG_MAX });
  assert.deepEqual(B.sanitize(JSON.parse(JSON.stringify(s)), now), s, "idempotent");
  // Xưởng M2: { level: 1, readyAt, done:false } = đang xây level 1; done:true = đã xong; level 2 = đã nâng
  const m2 = (x) => B.sanitize({ buildings: { xuong: x } }, now).buildings.xuong;
  assert.deepEqual(m2({ level: 1, readyAt: now + 30_000, done: false }), { level: 0, done: false, startAt: now - 30_000, readyAt: now + 30_000 });
  assert.equal(B.isBuilt({ buildings: { xuong: m2({ level: 1, readyAt: now - 5, done: false }) } }, "xuong", now), true);
  assert.deepEqual(m2({ level: 1, readyAt: now - 5, done: true }), { level: 1, done: true, startAt: now - 5, readyAt: now - 5 });
  assert.deepEqual(m2({ level: 2, readyAt: 7, done: true }), { level: 2, done: true, startAt: 7, readyAt: 7 });
  assert.equal(B.effects({ buildings: { xuong: m2({ level: 2, readyAt: 7, done: true }) } }, now).extraQueueSlots, 1);
});

test("migrate: kho đã nâng ở M1 ⇒ Nhà kho đã xây đúng mốc", () => {
  assert.deepEqual(B.migrate({ warehouseTier: 0 }, T0).buildings, {});
  const b = B.migrate({ warehouseTier: 1 }, T0);
  assert.equal(B.effects(b).warehouseCap, WAREHOUSE[1].cap);
  assert.equal(B.levelOf(b, "nha-kho", T0), 2);
  assert.equal(B.effects(B.migrate({ warehouseTier: 77 }, T0)).warehouseCap, WAREHOUSE[WAREHOUSE.length - 1].cap);
});

test("fuzz: vài nghìn action ngẫu nhiên giữ bất biến", () => {
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const ids = [...BUILDINGS.map((d) => d.id), "hack", "__proto__", "constructor"];
  const decorIds = [...DECOR.map((d) => d.id), "x"];
  const slots = [...DECOR_SLOTS.map((s) => s.id), "zz"];
  const oks = { build: 0, place: 0, done: 0 };
  for (let run = 0; run < 6; run++) {
    const b = B.createBuild();
    const w = wallet(Math.floor(rnd() * 5000));
    const i = inv({ "van-go": Math.floor(rnd() * 30), "hop-dinh": Math.floor(rnd() * 30), "thung-son": Math.floor(rnd() * 10) });
    let now = T0, level = 1;
    const readyOf = {};
    for (let k = 0; k < 800; k++) {
      const r = rnd();
      now += pick([0, 1, 999, 30_000, MIN, 5 * MIN, HOUR]);
      if (rnd() < 0.05) level = Math.min(20, level + 1);
      const before = snap(b, w.n, i.bag);
      let res;
      if (r < 0.25) res = B.startBuild(b, w, i, pick(ids), now, { level });
      else if (r < 0.45) res = B.startUpgrade(b, w, i, pick(ids), now, { level });
      else if (r < 0.55) { for (const f of B.tick(b, now)) { assert.ok(now >= readyOf[f.id], `${f.id} xong trước readyAt`); oks.done++; } res = { ok: true }; }
      else if (r < 0.65) res = B.addDecor(b, pick(decorIds), pick([1, 2, 0, -1, 1.5, 200]));
      else if (r < 0.8) { res = B.placeDecor(b, pick(decorIds), pick(slots), now, { level }); if (res.ok) oks.place++; }
      else if (r < 0.9) res = B.removeDecor(b, pick(slots));
      else if (r < 0.95) { w.earn(Math.floor(rnd() * 2000)); i.add(pick(["van-go", "hop-dinh", "thung-son"]), 1 + Math.floor(rnd() * 5)); res = { ok: true }; }
      else { const s = B.sanitize(JSON.parse(JSON.stringify(b)), now); assert.deepEqual(s, B.sanitize(s, now)); res = { ok: true }; }
      if (res.err) assert.equal(snap(b, w.n, i.bag), before, `err ${res.err} đổi trạng thái`);
      if (res.ok && res.readyAt !== undefined) {
        readyOf[res.id] = res.readyAt; oks.build++;
        assert.ok(level >= BUILDING[res.id].levels[res.level - 1].unlock, "chỉ xây / nâng khi đủ cấp");
        assert.ok(res.instant ? res.readyAt === now : res.readyAt > now);
      }
      // bất biến
      assert.ok(Number.isFinite(w.n) && w.n >= 0, "xu ≥ 0");
      for (const q of Object.values(i.bag)) assert.ok(Number.isInteger(q) && q >= 0, "vật liệu nguyên ≥ 0");
      for (const q of Object.values(b.decor)) assert.ok(Number.isInteger(q) && q >= 1 && q <= DECOR_BAG_MAX + 800, "túi");
      for (const [id, x] of Object.entries(b.buildings)) {
        assert.ok(BUILDING[id], "id hợp lệ " + id);
        assert.ok(x.level >= 0 && x.level <= maxLevel(id), "level ≤ max");
        assert.ok(B.levelOf(b, id, now) <= maxLevel(id));
        if (!x.done) assert.ok(x.level < maxLevel(id));
        if (x.level === 0) assert.equal(x.done, false);
        if (!x.done && now < x.readyAt) assert.ok(B.isBusy(b, id, now));
        if (x.done) assert.ok(x.readyAt <= now, "xong trước readyAt");
      }
      assert.equal(new Set(b.decorPlaced.map((d) => d.slot)).size, b.decorPlaced.length, "mỗi ô 1 món");
      const e = B.effects(b, now);
      assert.ok(WAREHOUSE.some((t) => t.cap === e.warehouseCap));
    }
  }
  assert.ok(oks.build > 30 && oks.place > 10 && oks.done > 5, JSON.stringify(oks)); // fuzz thực sự đi qua nhánh thành công
});

test("khớp dữ liệu của M2 / M4 nếu có: data/workshop.js, data/animals.js", async () => {
  const load = async (f) => { try { return await import(f); } catch { return null; } };
  const ws = await load("../data/workshop.js?v=m15");
  if (ws?.WORKSHOP) {
    const W = ws.WORKSHOP, L = BUILDING[W.id].levels;
    assert.deepEqual([L[0].cost, L[0].ms, L[0].unlock], [W.cost, W.buildMs, W.unlock]);
    W.upgrades.forEach((u, k) => { assert.equal(L[k + 1].cost, u.cost); assert.equal(L[k + 1].unlock, u.level); assert.equal(L[k + 1].effect.extraQueueSlots, u.extraSlots); });
  }
  const an = await load("../data/animals.js?v=m15");
  if (an?.ANIMALS) {
    const key = { "chuong-ga": "chickenCap", "chuong-bo": "cowCap" };
    for (const a of an.ANIMALS) {
      const L = BUILDING[a.housing].levels;
      assert.deepEqual(L.map((l) => l.effect[key[a.housing]]), a.capacityByLevel, a.housing);
      assert.ok(L[0].unlock <= a.level, `${a.id}: chuồng mở trước khi mua được`);
    }
  }
});
