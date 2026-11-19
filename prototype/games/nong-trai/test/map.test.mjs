// Test bản đồ theo cấp (Milestone 3) — core/levels-map.js.
import test from "node:test";
import assert from "node:assert/strict";
import { mapLayout, unlocksAt, unlockTable, lotMenu } from "../core/levels-map.js?v=m5";
import * as B from "../core/build.js?v=m5";
import { BUILDINGS, LOTS, DECOR_SLOTS, EAST_W } from "../data/buildings.js?v=m5";
import { LEVELS, MAX_LEVEL } from "../data/levels.js?v=m5";
import manifest from "../assets/v3/manifest.json" with { type: "json" };
import { existsSync } from "node:fs";

const T0 = 5_000_000, MIN = 60_000;
const rich = () => [{ n: 1e9, coins() { return this.n; }, spend(k) { if (this.n < k) return false; this.n -= k; return true; }, earn(k) { this.n += k; } },
  { has: () => true, take: () => true, add: () => ({ ok: true, overflow: 0 }), count: () => 999 }];
const byId = (L) => Object.fromEntries(L.items.map((i) => [i.id, i]));

test("mọi sprite tồn tại trong manifest / assets/garden", () => {
  const ids = (sheet) => new Set(manifest.sheets[sheet].frames.map((f) => f.id));
  const check = (s, where) => {
    if (!s) return;
    if (s.sheet === "garden") assert.ok(existsSync(new URL(`../assets/garden/${s.id}.webp`, import.meta.url)), where);
    else assert.ok(manifest.sheets[s.sheet] && ids(s.sheet).has(s.id), `${where}: ${s.sheet}/${s.id}`);
  };
  for (const d of BUILDINGS) d.levels.forEach((l, i) => { check(l.sprite, `${d.id}#${i}`); check(l.rotor, `${d.id} rotor`); });
  check({ sheet: "buildings", id: "lo-ban-ve" }, "blueprint"); check({ sheet: "buildings", id: "gian-giao" }, "scaffold");
  // sprite level 2 từ buildings-2 khi có
  assert.equal(BUILDINGS.find((d) => d.id === "xuong").levels[1].sprite.id, "xuong-che-bien-2");
  assert.equal(BUILDINGS.find((d) => d.id === "chuong-ga").levels[1].sprite.id, "chuong-ga-2");
  assert.equal(BUILDINGS.find((d) => d.id === "nha-kinh").levels[1].sprite.id, "nha-kinh-2");
  assert.equal(BUILDINGS.find((d) => d.id === "nha-kho").levels[3].sprite.id, "nha-kho-2");
});

test("bố cục: nhà trên-trái, sạp trên-phải, kho trái, xưởng phải, cối xay phải ao, chuồng gà dưới-trái, nhà kính dưới-phải", () => {
  const P = Object.fromEntries(BUILDINGS.map((d) => [d.id, d]));
  assert.ok(P.nha.x < 0.3 && P.nha.y < 0.35);
  assert.ok(P["sap-cho"].x > 0.7 && P["sap-cho"].y < 0.35);
  assert.ok(P["nha-kho"].x < 0.3 && P["xuong"].x > 0.7);
  assert.ok(P["coi-xay-gio"].x > 720 / 960);
  assert.ok(P["chuong-ga"].x < 0.3 && P["chuong-ga"].y > 0.85);
  assert.ok(P["nha-kinh"].x > 0.7 && P["nha-kinh"].y > 0.85);
  assert.ok(P["dat-phia-dong"].x > 1 && P["dat-phia-dong"].x < EAST_W);
  assert.equal(new Set(LOTS.map((l) => l.id)).size, LOTS.length);
  assert.equal(new Set(DECOR_SLOTS.map((s) => s.id)).size, DECOR_SLOTS.length);
});

test("cấp 1: nhà, sạp, bảng đơn đã có; lô khác là bản vẽ khoá; không có cảnh tự xuất hiện / phía Đông", () => {
  const L = mapLayout({ build: B.createBuild(), level: 1, now: T0 });
  const M = byId(L);
  for (const id of ["nha", "sap-cho", "bang-don-hang"]) assert.equal(M[id].view, "built");
  assert.equal(M["sap-cho"].sprite.id, "market");
  for (const id of ["nha-kho", "xuong", "coi-xay-gio", "chuong-ga", "chuong-bo", "nha-kinh", "dat-phia-dong"]) {
    assert.equal(M[id].view, "locked", id); assert.equal(M[id].sprite.id, "lo-ban-ve");
  }
  assert.equal(M["nha-kho"].unlockLevel, 3);
  assert.ok(!M["bien-lang"] && !M["xe-giao-hang"]);
  assert.deepEqual(L.bounds, { w: 1, h: 1 }); assert.equal(L.fields.length, 1);
  assert.deepEqual(L.emptyLots, []);
  assert.ok(L.decorSlots.every((s) => !s.open), "trang trí từ cấp 3");
  for (let k = 1; k < L.items.length; k++) assert.ok(L.items[k - 1].y <= L.items[k].y, "thứ tự vẽ theo y");
});

test("xây → xuất hiện trên bản đồ: bản vẽ xanh → giàn giáo → công trình → level 2", () => {
  const b = B.createBuild(); const [w, i] = rich();
  let M = byId(mapLayout({ build: b, level: 4, now: T0 }));
  assert.equal(M["xuong"].view, "blueprint");
  assert.deepEqual(M["xuong"].next, { level: 1, unlock: 4, cost: 150, materials: {}, ms: MIN });
  B.startBuild(b, w, i, "xuong", T0, { level: 4 });
  M = byId(mapLayout({ build: b, level: 4, now: T0 + MIN / 2 }));
  assert.equal(M["xuong"].view, "scaffold"); assert.equal(M["xuong"].sprite.id, "gian-giao");
  assert.equal(M["xuong"].progress, 0.5); assert.equal(M["xuong"].remainingMs, MIN / 2);
  M = byId(mapLayout({ build: b, level: 4, now: T0 + MIN }));
  assert.equal(M["xuong"].view, "built"); assert.equal(M["xuong"].sprite.id, "xuong-che-bien");
  assert.equal(M["xuong"].status, "done");
  B.tick(b, T0 + MIN);
  M = byId(mapLayout({ build: b, level: 13, now: T0 + MIN }));
  assert.equal(M["xuong"].status, "upgradeable");
  assert.ok(B.startUpgrade(b, w, i, "xuong", T0 + MIN, { level: 13 }).instant, "Xưởng cấp 2 tức thì như data/workshop.js");
  M = byId(mapLayout({ build: b, level: 13, now: T0 + MIN }));
  assert.equal(M["xuong"].sprite.id, "xuong-che-bien-2"); assert.equal(M["xuong"].upgrading, null);
  assert.equal(M["xuong"].next, null);
  // nâng có thời gian (chuồng gà): vẫn vẽ công trình cũ + giàn giáo nhỏ / đồng hồ, xong thì đổi sprite level 2
  B.startBuild(b, w, i, "chuong-ga", T0, { level: 10 });
  const u = B.startUpgrade(b, w, i, "chuong-ga", T0 + 2 * MIN, { level: 10 });
  M = byId(mapLayout({ build: b, level: 10, now: T0 + 3 * MIN }));
  assert.equal(M["chuong-ga"].view, "built"); assert.equal(M["chuong-ga"].sprite.id, "chuong-ga");
  assert.deepEqual(M["chuong-ga"].upgrading, { toLevel: 2, progress: 0.5, remainingMs: MIN });
  M = byId(mapLayout({ build: b, level: 10, now: u.readyAt }));
  assert.equal(M["chuong-ga"].sprite.id, "chuong-ga-2"); assert.equal(M["chuong-ga"].upgrading, null);
  assert.equal(M["chuong-ga"].level, 2);
});

test("cối xay gió theo máy coi-xay của production; cảnh tự xuất hiện theo cấp", () => {
  const prod = { machines: { "coi-xay": { readyAt: T0 + 90_000 } } };
  let M = byId(mapLayout({ build: B.createBuild(), level: 5, now: T0 }));
  assert.equal(M["coi-xay-gio"].view, "blueprint");
  M = byId(mapLayout({ build: B.createBuild(), level: 5, now: T0, production: prod }));
  assert.equal(M["coi-xay-gio"].view, "scaffold"); assert.equal(M["coi-xay-gio"].remainingMs, 90_000);
  M = byId(mapLayout({ build: B.createBuild(), level: 11, now: T0 + 90_000, production: prod }));
  assert.equal(M["coi-xay-gio"].view, "built"); assert.equal(M["coi-xay-gio"].rotor.id, "canh-coi-xay");
  assert.equal(M["bien-lang"].view, "built"); assert.equal(M["xe-giao-hang"].view, "built");
  assert.ok(!byId(mapLayout({ build: B.createBuild(), level: 10, now: T0 }))["xe-giao-hang"]);
});

test("đất phía Đông: mở rộng bản đồ, +9 ô, 1 lô xây, ô trang trí phía Đông", () => {
  const b = B.createBuild(); const [w, i] = rich();
  let L = mapLayout({ build: b, level: 17, now: T0 });
  assert.equal(byId(L)["dat-phia-dong"].view, "blueprint");
  const r = B.startBuild(b, w, i, "dat-phia-dong", T0, { level: 17 });
  L = mapLayout({ build: b, level: 17, now: T0 + 1 });
  assert.equal(byId(L)["dat-phia-dong"].view, "scaffold"); assert.equal(L.eastOpen, false);
  L = mapLayout({ build: b, level: 17, now: r.readyAt });
  assert.equal(L.eastOpen, true); assert.deepEqual(L.bounds, { w: EAST_W, h: 1 });
  assert.ok(!byId(L)["dat-phia-dong"], "đã mở ⇒ không vẽ như công trình");
  assert.equal(L.fields[1].cols * L.fields[1].rows, 9);
  assert.deepEqual(L.emptyLots.map((l) => l.id), ["lo-dong"]);
  assert.ok(L.decorSlots.some((s) => s.id.startsWith("dong-") && s.open));
  assert.deepEqual(lotMenu({ build: b, level: 17, now: r.readyAt }, "lo-dong").options, []);
});

test("trang trí hiện trên bản đồ, ô bị chiếm không còn free", () => {
  const b = B.createBuild();
  B.addDecor(b, "gieng-da"); B.placeDecor(b, "gieng-da", "san-kho", T0, { level: 19 });
  const L = mapLayout({ build: b, level: 19, now: T0 });
  assert.deepEqual(L.decor.map((d) => [d.id, d.slot, d.sprite.sheet]), [["gieng-da", "san-kho", "decor"]]);
  assert.equal(L.decorSlots.find((s) => s.id === "san-kho").free, false);
  assert.ok(L.decorSlots.find((s) => s.id === "cong").free);
});

test("unlocksAt: khớp data/levels.js + công trình theo cấp", () => {
  for (const row of LEVELS) assert.deepEqual(unlocksAt(row.lv).features.map((u) => u.id), row.unlocks.map((u) => u.id));
  const has = (lv, id, action) => unlocksAt(lv).build.some((x) => x.id === id && x.action === action);
  assert.ok(has(3, "nha-kho", "build")); assert.ok(has(4, "xuong", "build")); assert.ok(has(5, "coi-xay-gio", "machine"));
  assert.ok(has(6, "bien-lang", "appears")); assert.ok(has(7, "chuong-ga", "build")); assert.ok(has(9, "chuong-bo", "build"));
  assert.ok(has(10, "nha-kinh", "build")); assert.ok(has(11, "xe-giao-hang", "appears")); assert.ok(has(13, "xuong", "upgrade"));
  assert.ok(has(15, "nha-kho", "upgrade")); assert.ok(has(17, "dat-phia-dong", "build")); assert.ok(has(18, "nha-kho", "upgrade"));
  assert.ok(!has(2, "nha-kho", "upgrade"), "không nâng kho trước khi xây được");
  assert.deepEqual(unlocksAt(19).decor.map((d) => d.id).sort(), ["bu-nhin", "cong-tre", "den-long", "gieng-da"]);
  assert.equal(unlockTable().length, MAX_LEVEL);
  assert.deepEqual(unlocksAt(0), { level: 0, features: [], build: [], decor: [] });
  assert.deepEqual(unlocksAt(21).build, []);
});

test("bản đồ theo từng cấp 1..20 với người chơi xây mọi thứ ngay khi mở: không lô nào kẹt", () => {
  const b = B.createBuild(); const [w, i] = rich(); let now = T0;
  for (let lv = 1; lv <= 20; lv++) {
    for (const d of BUILDINGS) {
      const r = B.startBuild(b, w, i, d.id, now, { level: lv });
      if (r.ok) now = Math.max(now, r.readyAt);
    }
    now += 10 * MIN; B.tick(b, now);
    for (const d of BUILDINGS) for (let k = 0; k < 5; k++) { const r = B.startUpgrade(b, w, i, d.id, now, { level: lv }); if (r.ok) now = r.readyAt; }
    B.tick(b, now);
    const L = mapLayout({ build: b, level: lv, now });
    for (const it of L.items) {
      if (it.kind === "machine") continue;
      assert.ok(it.view === "built" || it.view === "locked", `cấp ${lv}: ${it.id} ${it.view}`);
      if (it.view === "locked") assert.ok(it.unlockLevel > lv);
      if (it.next) assert.ok(it.next.unlock > lv, `cấp ${lv}: ${it.id} còn nâng được`);
    }
  }
  const e = B.effects(b, now);
  assert.deepEqual([e.warehouseCap, e.extraQueueSlots, e.chickenCap, e.cowCap, e.greenhousePlots, e.eastPlots, e.marketFull], [320, 1, 10, 6, 9, 9, true]);
  assert.deepEqual([e.fameLevel, e.orderBonus], [11, 0.2], "Milestone 5: Nhà nâng hết 10 bậc");
});
