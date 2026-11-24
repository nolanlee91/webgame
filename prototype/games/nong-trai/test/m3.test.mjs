// Milestone 3 — xây dựng ghép vào apply(): startBuild / startUpgrade / placeDecor / removeDecor, sức chứa kho từ công trình,
// di chuyển save v4 (kho đã nâng ở cấp 2), Nhà kính (mía chỉ trồng ở đây, không cần tưới), Khu đất phía Đông (ô 25–33),
// công trình Milestone 4 bị từ chối, save v5 + sao lưu.
import test from "node:test";
import assert from "node:assert/strict";
import { apply } from "../core/apply.js?v=m8";
import { createState, loadSave, dump, SAVE_VERSION } from "../core/state.js?v=m8";
import { capacity } from "../core/inventory.js?v=m8";
import { extraSlots } from "../core/workshop.js?v=m8";
import { inMilestone } from "../core/construct.js?v=m8";
import { mapLayout } from "../core/levels-map.js?v=m8";
import { BUILDING } from "../data/buildings.js?v=m8";
import { CROP } from "../data/crops.js?v=m8";
import { TUTORIAL } from "../data/quests.js?v=m8";
import { CURRENT_MILESTONE, LEVELS } from "../data/levels.js?v=m8";
import { WAREHOUSE } from "../data/warehouse.js?v=m8";
import { farmSave, KEY, V4_KEY, V4_BACKUP_KEY } from "../save.js?v=m8";

const T = 3_000_000, MIN = 60_000;
const act = (s, a, t = T) => { const r = apply(s, a, t); if (r.err) throw new Error(`${a.type}: ${r.err}`); return r; };
const err = (s, a, t = T) => apply(s, a, t).err;
const types = (r) => r.events.map((e) => e.type);
function player(lv, coins = 100_000, t = T) {
  const s = createState(t, 5);
  s.level = lv; s.coins = coins; s.quests.tut = TUTORIAL.length;
  act(s, { type: "tick" }, t);
  return s;
}
const memStorage = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { map: m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

test("CURRENT_MILESTONE = 6: chuồng gà (cấp 7) / chuồng bò (cấp 9) xây được qua apply; dưới cấp ⇒ locked; id lạ ⇒ lỗi", () => {
  assert.equal(CURRENT_MILESTONE, 6);
  assert.ok(inMilestone("nha-kho") && inMilestone("nha-kinh") && inMilestone("dat-phia-dong") && inMilestone("xuong"));
  assert.ok(inMilestone("chuong-ga") && inMilestone("chuong-bo"));
  const low = player(6, 5000), lowBefore = structuredClone(low);
  assert.equal(err(low, { type: "startBuild", id: "chuong-ga" }), "locked");
  assert.deepEqual(low, lowBefore, "từ chối ⇒ không đổi gì");
  const lv9 = player(9, 5000);
  const r = act(lv9, { type: "startBuild", id: "chuong-ga" });
  assert.ok(r.events.some((e) => e.type === "buildStarted" && e.id === "chuong-ga" && e.cost === 300));
  assert.equal(lv9.coins, 4700);
  act(lv9, { type: "startBuild", id: "chuong-bo" });
  assert.equal(lv9.coins, 4100);
  const s = player(20);
  const before = structuredClone(s);
  for (const bad of [{ id: "__proto__" }, { id: "nha" }, { id: 5 }, {}, { id: "bien-lang" }, { id: "coi-xay-gio" }]) assert.ok(err(s, { type: "startBuild", ...bad }));
  assert.deepEqual(s, before);
});

test("startBuild Nhà kho (tức thì) + startUpgrade: sức chứa đổi theo build.effects, sự kiện, trừ xu / vật liệu", () => {
  const s = player(3, 1000);
  assert.equal(capacity(s), 60);
  const r = act(s, { type: "startBuild", id: "nha-kho" });
  assert.deepEqual(types(r).filter((x) => x === "buildStarted" || x === "buildingDone"), ["buildStarted", "buildingDone"]);
  assert.equal(s.coins, 940); assert.equal(capacity(s), 60);
  assert.equal(err(s, { type: "startBuild", id: "nha-kho" }), "built");
  const u = act(s, { type: "startUpgrade", id: "nha-kho" });
  assert.ok(u.events.some((e) => e.type === "warehouseUpgraded" && e.cap === 90 && e.from === 60));
  assert.equal(capacity(s), 90); assert.equal(s.warehouse, 1);
  // mốc 130 cần cấp 6 + vật liệu
  assert.equal(err(s, { type: "startUpgrade", id: "nha-kho" }), "locked");
  s.level = 6; s.inv = { "van-go": 2, "hop-dinh": 2 };
  act(s, { type: "startUpgrade", id: "nha-kho" });
  assert.equal(capacity(s), WAREHOUSE[2].cap);
  assert.deepEqual(s.inv, {});
});

test("Xưởng qua startBuild: tặng Bếp sên, giàn giáo 1 phút (offline), nâng cấp 2 ⇒ +1 ô hàng chờ từ effects (giá mới 6 000)", () => {
  const s = player(13, 10_000);
  const r = act(s, { type: "startBuild", id: "xuong" });
  assert.ok(!r.result.instant);
  assert.ok(s.production.machines["bep-sen"], "tặng Bếp sên");
  assert.equal(err(s, { type: "startUpgrade", id: "xuong" }, T + 1000), "building");
  const done = act(s, { type: "tick" }, T + MIN);
  assert.ok(done.events.some((e) => e.type === "buildingDone" && e.id === "xuong" && e.name === "Xưởng chế biến"));
  assert.equal(act(s, { type: "tick" }, T + 2 * MIN).events.filter((e) => e.type === "buildingDone").length, 0, "báo xong một lần");
  assert.equal(extraSlots(s, T + MIN), 0);
  assert.equal(BUILDING.xuong.levels[1].cost, 6000);
  act(s, { type: "startUpgrade", id: "xuong" }, T + MIN);
  assert.equal(extraSlots(s, T + MIN), 1);
  assert.equal(s.coins, 10_000 - 150 - 6000);
});

test("di chuyển save v4 (M2) đã nâng kho ở cấp 2: Nhà kho level 2, sức chứa 90 giữ nguyên, sao lưu v4 không xoá", () => {
  const m2 = createState(T, 9);
  const d = JSON.parse(dump(m2, T));
  d.v = 4; d.level = 2; d.warehouse = 1; d.plots = d.plots.slice(0, 25); delete d.decorPlaced;
  d.inv = { "ca-rot": 70 }; // kho 70/90
  const raw4 = JSON.stringify(d);
  const st = memStorage({ [V4_KEY]: raw4 });
  const save = farmSave(st);
  const first = save.initialize(T);
  assert.equal(first.migrated, true); assert.equal(first.from, "v4");
  assert.equal(st.getItem(V4_BACKUP_KEY), raw4); assert.equal(st.getItem(V4_KEY), raw4, "bản v4 gốc vẫn còn");
  assert.equal(JSON.parse(st.getItem(KEY)).v, SAVE_VERSION);
  assert.equal(SAVE_VERSION, 7);
  const s = save.read(T + 1000).state;
  assert.equal(s.level, 2);
  assert.deepEqual(s.buildings["nha-kho"], { level: 2, done: true, startAt: T, readyAt: T });
  assert.equal(capacity(s), 90, "không ai mất sức chứa");
  assert.equal(s.plots.length, 43);
  assert.deepEqual(s.inv, { "ca-rot": 70 });
  // người chơi cấp 2 không nâng được nữa (mốc 130 cần cấp 6), và Nhà kho đã hiện trên bản đồ
  assert.equal(err(s, { type: "startUpgrade", id: "nha-kho" }, T + 1000), "locked");
  const item = mapLayout({ build: s, level: s.level, now: T + 1000 }).items.find((i) => i.id === "nha-kho");
  assert.equal(item.view, "built"); assert.equal(item.level, 2);
  // v4 không nâng kho ⇒ chưa có Nhà kho, kho tạm 60
  const d0 = { ...d, warehouse: 0 };
  const s0 = loadSave(JSON.stringify(d0), T);
  assert.equal(s0.buildings["nha-kho"], undefined); assert.equal(capacity(s0), 60);
  // tier rác ⇒ kẹp
  assert.equal(capacity(loadSave(JSON.stringify({ ...d, warehouse: 99 }), T)), 320);
});

test("Nhà kính: xây (4 ván gỗ, 5 phút) ⇒ 6 ô 34–39; mía chỉ gieo ở đó, ô nhà kính tự tưới; ô thường từ chối mía", () => {
  const s = player(10, 5000);
  assert.deepEqual({ ...BUILDING["nha-kinh"].levels[0].materials }, { "van-go": 4 });
  assert.equal(err(s, { type: "startBuild", id: "nha-kinh" }), "materials");
  s.inv["van-go"] = 4;
  act(s, { type: "startBuild", id: "nha-kinh" });
  assert.equal(s.inv["van-go"], undefined);
  assert.equal(err(s, { type: "plant", i: 34, crop: "mia" }, T + MIN), "locked", "đang xây ⇒ ô chưa mở");
  assert.equal(err(s, { type: "plant", i: 12, crop: "mia" }, T + MIN), "level", "chưa xây xong ⇒ mía chưa mở");
  const t = T + 5 * MIN;
  act(s, { type: "tick" }, t);
  assert.deepEqual(s.plots.map((p, i) => p.open && i >= 25 ? i : -1).filter((i) => i >= 0), [34, 35, 36, 37, 38, 39]);
  const before = structuredClone(s);
  assert.equal(err(s, { type: "plant", i: 12, crop: "mia" }, t), "greenhouse-only");
  assert.deepEqual(s, before);
  const r = act(s, { type: "plant", i: 34, crop: "mia" }, t);
  assert.ok(r.events.some((e) => e.type === "planted" && e.greenhouse));
  assert.equal(s.plots[34].watered, true);
  assert.equal(s.plots[34].readyAt - t, Math.round(CROP.mia.growMs * 0.7), "không cần tưới: nhanh như đã tưới");
  assert.equal(err(s, { type: "water", i: 34 }, t), "greenhouse");
  act(s, { type: "plant", i: 35, crop: "ca-rot" }, t); // cây thường cũng trồng được trong nhà kính
  const h = act(s, { type: "harvest", i: 34 }, s.plots[34].readyAt);
  assert.equal(h.result.crop, "mia");
  assert.equal(s.plots[34].gh, true, "thu hoạch xong vẫn là ô nhà kính");
  assert.equal(err(s, { type: "plant", i: 40, crop: "mia" }, t), "locked", "ô 40–42 mở khi nâng nhà kính");
  assert.equal(err(s, { type: "buyPlot", i: 40 }, t), "bad");
});

test("Khu đất phía Đông (cấp 17, 15 000 xu + vật liệu, 5 phút): ô 25–33 mở, gieo / thu được, lưu / tải giữ nguyên", () => {
  const s = player(17, 20_000);
  s.inv = { "van-go": 8, "hop-dinh": 8 };
  assert.equal(err(s, { type: "plant", i: 25, crop: "ca-rot" }), "locked");
  act(s, { type: "startBuild", id: "dat-phia-dong" });
  assert.equal(s.coins, 5000);
  assert.ok(s.plots.slice(25, 34).every((p) => !p.open));
  const t = T + 5 * MIN;
  const tk = act(s, { type: "tick" }, t);
  assert.ok(tk.events.some((e) => e.type === "buildingDone" && e.id === "dat-phia-dong"));
  assert.ok(s.plots.slice(25, 34).every((p) => p.open && p.east));
  for (let i = 25; i <= 33; i++) act(s, { type: "plant", i, crop: "ca-chua" }, t);
  act(s, { type: "water", i: 25 }, t);
  const back = loadSave(dump(s, t), t);
  assert.deepEqual(back.plots, s.plots);
  const h = act(back, { type: "harvestAll" }, t + MIN);
  assert.equal(h.result.count, 9);
  const L = mapLayout({ build: back, level: 17, now: t });
  assert.equal(L.eastOpen, true); assert.equal(L.fields.length, 2);
});

test("trang trí: đặt từ túi lên ô, ô bận / sai cỡ / chưa đủ cấp bị từ chối, cất về túi; hiếm từ cấp 19", () => {
  const s = player(3, 0);
  s.decor = { "chau-hoa": 1, "gieng-da": 1 };
  const before = structuredClone(s);
  assert.equal(err(s, { type: "placeDecor", id: "gieng-da", slot: "cong" }), "locked", "đồ hiếm cấp 19");
  assert.equal(err(s, { type: "placeDecor", id: "ghe-tre", slot: "hien-nha" }), "locked");
  assert.equal(err(s, { type: "placeDecor", id: "chau-hoa", slot: "dong-1" }), "slot", "ô phía Đông chưa mở");
  assert.equal(err(s, { type: "placeDecor", id: "chau-hoa" }), "bad");
  assert.deepEqual(s, before);
  const r = act(s, { type: "placeDecor", id: "chau-hoa", slot: "cong" }); // ô lớn nhận cả đồ nhỏ
  assert.ok(r.events.some((e) => e.type === "decorPlaced" && e.name === "Chậu hoa"));
  assert.deepEqual(s.decor, { "gieng-da": 1 }); assert.deepEqual(s.decorPlaced, [{ id: "chau-hoa", slot: "cong" }]);
  assert.equal(err(s, { type: "placeDecor", id: "chau-hoa", slot: "goc-ruong-tl" }), "no-decor");
  s.level = 19;
  assert.equal(err(s, { type: "placeDecor", id: "gieng-da", slot: "cong" }), "slot-taken");
  assert.equal(err(s, { type: "placeDecor", id: "gieng-da", slot: "goc-ruong-tl" }), "slot-size");
  act(s, { type: "placeDecor", id: "gieng-da", slot: "san-kho" });
  const back = loadSave(dump(s, T), T);
  assert.deepEqual(back.decorPlaced, s.decorPlaced);
  const rm = act(s, { type: "removeDecor", slot: "cong" });
  assert.ok(rm.events.some((e) => e.type === "decorRemoved" && e.id === "chau-hoa"));
  assert.deepEqual(s.decor, { "chau-hoa": 1 });
  assert.equal(err(s, { type: "removeDecor", slot: "cong" }), "slot-empty");
  assert.equal(err(s, { type: "removeDecor" }), "bad");
});

test("data/levels.js: nâng kho mốc 90 ở cấp 3 (cùng lúc xây kho), không còn 'warehouse-upgrade' ở cấp 2; mọi món M3 có thật", () => {
  assert.equal(WAREHOUSE[1].minLevel, 3);
  assert.equal(BUILDING["nha-kho"].levels[1].unlock, 3);
  assert.ok(!LEVELS.find((l) => l.lv === 2).unlocks.some((u) => u.id === "warehouse-upgrade"));
  const m3 = LEVELS.flatMap((l) => l.unlocks).filter((u) => u.milestone === 3).map((u) => u.id).sort();
  assert.deepEqual(m3, ["build-warehouse", "east-land", "greenhouse"]);
});

test("cân bằng M3 (tools/sim/report.md): mốc tiêu xu muộn ×4–6, nhà kính 4 ván gỗ", () => {
  assert.equal(BUILDING["dat-phia-dong"].levels[0].cost, 15000);
  assert.equal(BUILDING["nha-kinh"].levels[1].cost, 7500);
  assert.deepEqual([WAREHOUSE[3].cost, WAREHOUSE[4].cost], [3600, 9000]);
});
