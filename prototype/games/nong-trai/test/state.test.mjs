import test from "node:test";
import assert from "node:assert/strict";
import { createState, loadV3, migrateV2, dump, START_COINS } from "../core/state.js?v=m18";
import { apply } from "../core/apply.js?v=m18";
import { readyWhileAway, stage } from "../core/plots.js?v=m18";
import { used, capacity } from "../core/inventory.js?v=m18";
import { farmSave, KEY, V2_KEY, BACKUP_KEY, V5_KEY, V5_BACKUP_KEY } from "../save.js?v=m18";
import { START } from "./helpers.mjs";
import { xpNeed } from "../core/progression.js?v=m18";

/** Bản lưu v2 thật (định dạng của logic.js cũ + đơn hàng chưa commit). */
function v2Save(t) {
  const plots = Array.from({ length: 25 }, (_, i) => ({ open: [6, 7, 8, 11, 12, 13, 16, 17, 18, 2, 1].includes(i), crop: null, plantAt: 0, readyAt: 0, watered: false }));
  plots[6] = { open: true, crop: "ngo", plantAt: t - 60_000, readyAt: t + 120_000, watered: false };
  plots[7] = { open: true, crop: "ca-chua", plantAt: t - 50_000, readyAt: t + 10_000, watered: true };
  plots[12] = { open: true, crop: "dau-tay", plantAt: t - 200_000, readyAt: t - 110_000, watered: false };
  plots[2] = { open: true, crop: "ca-rot", plantAt: t - 5000, readyAt: t + 25_000, watered: false };
  return {
    v: 2, coins: 137, xp: 12, level: 3, bought: 2, lastSeen: t - 30_000, freeSeeds: 0, upgrade: 1,
    stock: { "ca-rot": 4, "ca-chua": 70, "dau-tay": 2, "ngo": 0, "bi-ngo": 0 },
    orders: [{ recipe: 4, revision: 3 }, { recipe: 5, revision: 1 }],
    plots, stats: { harvested: 88, earned: 640 },
  };
}
const memStorage = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { map: m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

test("di chuyển v2 → v3: giữ xu, XP, cấp, ô đã mua, cây đang trồng (timestamp tuyệt đối), kho, hạt tặng, nâng cấp, đơn", () => {
  const v2 = v2Save(START);
  const s = migrateV2(JSON.stringify(v2), START);
  assert.equal(s.v, 7);
  assert.equal(s.coins, 137); assert.equal(s.xp, 12); assert.equal(s.level, 3); assert.equal(s.bought, 2);
  assert.equal(s.freeSeeds, 0); assert.equal(s.upgrade, 1);
  assert.deepEqual(s.inv, { "ca-rot": 4, "ca-chua": 70, "dau-tay": 2 }, "kho cũ giữ nguyên, kể cả vượt 60");
  assert.ok(used(s) > capacity(s));
  assert.equal(s.plots.filter((p) => p.open).length, 11);
  for (const i of [6, 7, 12, 2]) {
    assert.equal(s.plots[i].crop, v2.plots[i].crop);
    assert.equal(s.plots[i].readyAt, v2.plots[i].readyAt);
    assert.equal(s.plots[i].watered, v2.plots[i].watered);
  }
  assert.equal(s.stats.harvested, 88); assert.equal(s.stats.earned, 640);
  assert.deepEqual(s.orders.slots[0].order.items, { "dau-tay": 2, "ca-chua": 1 });
  assert.equal(s.orders.slots[0].rev, 3);
  assert.deepEqual(s.orders.slots[1].order.items, { "ngo": 2, "dau-tay": 1 });
  assert.equal(s.orders.slots[0].order.coins, Math.ceil((36 + 12) * 1.2));
  assert.equal(s.quests.tut, 8, "người chơi cũ cấp ≥ 3 bỏ qua hướng dẫn");
  // đồng bộ lần đầu: cấp 3 ⇒ 4 ô đơn
  const r = apply(s, { type: "tick" }, START);
  assert.ok(r.ok);
  assert.equal(s.orders.slots.length, 4);
  assert.ok(s.orders.slots.every((x) => x.order));
  // vẫn giao được đơn cũ
  const x = s.orders.slots[0];
  assert.ok(apply(s, { type: "deliver", slot: 0, id: x.order.id, rev: x.rev }, START).ok);
  assert.equal(s.coins, 137 + 58);
});

test("save adapter: lần đầu có v2 ⇒ ghi v3, chép v2 sang backup, không xoá v2; lần sau đọc v3", () => {
  const raw = JSON.stringify(v2Save(START));
  const st = memStorage({ [V2_KEY]: raw });
  const save = farmSave(st);
  const first = save.read(START);
  assert.equal(first.migrated, true);
  assert.equal(first.fresh, false);
  save.initialize(START);
  assert.equal(st.getItem(BACKUP_KEY), raw);
  assert.equal(st.getItem(V2_KEY), raw, "dữ liệu v2 gốc vẫn còn");
  assert.equal(JSON.parse(st.getItem(KEY)).v, 7);
  const second = save.read(START + 1000);
  assert.equal(second.migrated, false);
  assert.equal(second.state.coins, 137);
  // backup không bị ghi đè lần sau
  st.setItem(V2_KEY, "{}");
  save.backupV2("khác");
  assert.equal(st.getItem(BACKUP_KEY), raw);
});

test("save adapter: chưa có gì ⇒ ruộng mới (fresh); v3 hỏng mà còn v2 ⇒ di chuyển lại từ v2", () => {
  const st = memStorage();
  const save = farmSave(st);
  assert.equal(save.read(START).fresh, true);
  const st2 = memStorage({ [KEY]: "{hỏng", [V2_KEY]: JSON.stringify(v2Save(START)) });
  assert.equal(farmSave(st2).read(START).state.coins, 137);
  const st3 = memStorage({ [KEY]: "{hỏng" });
  const r = farmSave(st3).read(START);
  assert.equal(r.fresh, false);
  assert.equal(r.state.coins, START_COINS);
});

test("offline: cây chín khi vắng, summary đếm đúng; tải lại giữ nguyên mọi thứ", () => {
  const st = memStorage();
  const save = farmSave(st);
  save.initialize(START);
  const { state: s } = save.read(START);
  apply(s, { type: "plant", i: 6, crop: "ca-chua" }, START);
  s.inv["ca-rot"] = 1;
  assert.ok(save.write(s, START + 5000));
  const { state: back } = save.read(START + 70_000);
  assert.equal(readyWhileAway(back, START + 70_000), 1);
  assert.equal(stage(back.plots[6], START + 70_000), "ready");
  assert.equal(back.coins, s.coins);
  assert.equal(back.inv["ca-rot"], 1);
  assert.deepEqual(back.orders, s.orders);
  assert.deepEqual(back.quests, s.quests);
  assert.ok(apply(back, { type: "harvest", i: 6 }, START + 70_000).ok);
});

test("load kẹp dữ liệu rác: số âm / NaN / quá lớn, món lạ, cây lạ, đơn giả mạo thưởng, giỏ tràn quá 10, timestamp tương lai", () => {
  const s = createState(START, 5);
  const d = JSON.parse(dump(s, START));
  Object.assign(d, { coins: -50, xp: 1e9, level: "7", freeSeeds: 999, warehouse: 99, upgrade: -3, seed: "x", giftAt: START * 10 });
  d.inv = { "ca-rot": -9, "ca-chua": 2.7, "__proto__": 5, "constructor": 3, "khong-co": 4, "van-go": "9" };
  d.overflow = { "ca-rot": 30, "van-go": 3 };
  d.plots[12].crop = "constructor";
  d.plots[6] = { open: true, crop: "ca-rot", plantAt: 0, readyAt: START * 1000, watered: 1 };
  d.orders.slots[0].order.coins = 999999;
  d.orders.slots[0].order.mult = 50;
  d.orders.slots[1].order.items = { "bi-ngo": 3 }; // chưa mở ở cấp 1
  d.orders.slots[2].order.id = d.orders.slots[0].order.id; // id trùng
  d.orders.slots[2].refillAt = START * 1000;
  d.orders.slots.push({ rev: 0, order: null, refillAt: 0 }, { rev: 0, order: null, refillAt: 0 }); // quá số ô của cấp
  d.quests = { tut: 99, progress: -1 };
  const l = loadV3(d, START);
  assert.equal(l.coins, 0);
  assert.equal(l.level, 1);
  assert.equal(l.xp, xpNeed(1) - 1, "XP kẹp dưới mức lên cấp");
  assert.equal(l.freeSeeds, 3);
  assert.equal(l.warehouse, 0, "v5: mốc kho suy ra từ công trình Nhà kho, không tin field warehouse");
  assert.equal(l.upgrade, 0);
  assert.ok(Number.isInteger(l.seed));
  assert.ok(l.giftAt <= START);
  assert.deepEqual(l.inv, { "ca-chua": 2, "ca-rot": 20 }, "giỏ tràn thừa về kho, món lạ / âm bị bỏ");
  assert.deepEqual(l.overflow, { "ca-rot": 10 });
  assert.equal(l.plots[12].crop, null);
  assert.ok(l.plots[6].readyAt <= START + 30_000);
  assert.equal(l.orders.slots[0].order.coins, 15, "thưởng tính lại từ món");
  assert.equal(l.orders.slots[1].order, null, "đơn đòi món chưa mở bị bỏ");
  assert.equal(l.orders.slots[2].order, null, "id trùng bị bỏ");
  assert.ok(l.orders.slots[2].refillAt <= START + 120_000);
  assert.equal(l.orders.slots.length, 3);
  assert.equal(l.quests.tut, 13, "kẹp về cuối sổ nhiệm vụ (8 hướng dẫn + 5 tiến trình)");
  // các giá trị không phải object
  for (const junk of [null, 42, "[]", "null", { v: 3 }, { v: 3, plots: [] }, { v: 2 }]) assert.equal(loadV3(junk, START), null);
  assert.equal(migrateV2("{", START), null);
  assert.equal(migrateV2({ v: 1, plots: [] }, START), null);
  const after = apply(l, { type: "tick" }, START);
  assert.ok(after.ok);
  assert.ok(l.orders.slots[1].order, "ô bị bỏ được lấp ngay");
});

test("Milestone 4: save v5 → v7 (đàn / làng trống, sao lưu v5 không xoá); đơn có trứng / sữa giữ qua lưu-tải; kind \"bo\" cũ ⇒ \"bo-sua\"", () => {
  const s5 = createState(START, 9);
  Object.assign(s5, { v: 5, level: 9, coins: 777, inv: { "trung-ga": 2 } });
  delete s5.animals; delete s5.village; delete s5.lastDeliveryAt;
  const raw5 = JSON.stringify(s5);
  const st = memStorage({ [V5_KEY]: raw5 });
  const save = farmSave(st);
  const first = save.initialize(START);
  assert.equal(first.migrated, true); assert.equal(first.from, "v5");
  assert.equal(st.getItem(V5_BACKUP_KEY), raw5); assert.equal(st.getItem(V5_KEY), raw5, "bản v5 gốc vẫn còn");
  assert.equal(KEY, "wgp.nongtrai.v7");
  const s = save.read(START + 1000).state;
  assert.equal(s.v, 7); assert.equal(s.coins, 777); assert.deepEqual(s.inv, { "trung-ga": 2 });
  assert.deepEqual(s.animals, { list: [], nextUid: 1 }); assert.ok(s.village && s.village.board); assert.equal(s.lastDeliveryAt, null);
  // đơn có trứng + sữa trong ô 0 ⇒ tải lại vẫn còn (loadOrder nhận món chăn nuôi)
  s.orders.slots[0].order.items = { "trung-ga": 2, sua: 1 };
  s.animals.list.push({ uid: 1, kind: "bo", fedAt: null, readyAt: null }); s.animals.nextUid = 2;
  s.lastDeliveryAt = START + 500;
  const back = loadV3(dump(s, START + 1000), START + 1000);
  assert.deepEqual(back.orders.slots[0].order.items, { "trung-ga": 2, sua: 1 });
  assert.equal(back.orders.slots[0].order.id, s.orders.slots[0].order.id);
  assert.equal(back.animals.list[0].kind, "bo-sua");
  assert.equal(back.lastDeliveryAt, START + 500);
  const future = JSON.parse(dump(s, START)); future.lastDeliveryAt = START * 10;
  assert.equal(loadV3(future, START).lastDeliveryAt, null, "mốc xe ở tương lai bị bỏ");
});
