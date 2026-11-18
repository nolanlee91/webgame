// Chạy: node --test test/logic.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";

const T0 = 1_000_000;
const CENTER = 12; // ô (2,2)

test("ruộng mới: 5×5, mở sẵn 3×3 giữa, 20 xu, cấp 1", () => {
  const s = L.newFarm(T0);
  assert.equal(s.plots.length, 25);
  assert.equal(s.plots.filter((p) => p.open).length, 9);
  assert.ok(s.plots[CENTER].open && !s.plots[0].open);
  assert.equal(s.coins, L.START_COINS);
  assert.equal(s.level, 1);
});

test("trồng: trừ tiền hạt, chặn ô khoá / ô đang trồng / thiếu tiền / chưa đủ cấp", () => {
  const s = L.newFarm(T0);
  assert.deepEqual(L.plant(s, CENTER, "rau-muong", T0), { ok: true, cost: 2 });
  assert.equal(s.coins, 18);
  assert.equal(L.plant(s, CENTER, "ca-rot", T0).err, "busy");
  assert.equal(L.plant(s, 0, "rau-muong", T0).err, "locked");
  assert.equal(L.plant(s, 6, "bap", T0).err, "level");
  assert.equal(L.plant(s, 6, "khong-co", T0).err, "bad");
  s.coins = 1;
  assert.equal(L.plant(s, 6, "rau-muong", T0).err, "coins");
  assert.equal(s.coins, 1, "lỗi thì không trừ tiền");
});

test("lớn theo thời gian: hạt → mầm → lớn → chín; chưa chín thì không thu được", () => {
  const s = L.newFarm(T0), p = s.plots[CENTER];
  L.plant(s, CENTER, "ca-rot", T0); // 60 s
  assert.equal(L.stage(p, T0), "seed");
  assert.equal(L.stage(p, T0 + 30_000), "sprout");
  assert.equal(L.stage(p, T0 + 50_000), "grow");
  assert.equal(L.harvest(s, CENTER, T0 + 59_999).err, "growing");
  assert.equal(L.stage(p, T0 + 60_000), "ready");
  const r = L.harvest(s, CENTER, T0 + 60_000);
  assert.equal(r.coins, 14); assert.equal(r.xp, 3);
  assert.equal(s.coins, 20 - 5 + 14);
  assert.equal(p.crop, null);
  assert.equal(s.stats.harvested, 1);
});

test("tưới: thời gian CÒN LẠI giảm 30%, chỉ 1 lần, không tưới ô trống / ô đã chín; tiến độ không tụt", () => {
  const s = L.newFarm(T0), p = s.plots[CENTER];
  assert.equal(L.water(s, CENTER, T0).err, "empty");
  L.plant(s, CENTER, "ca-rot", T0);
  const before = L.progress(p, T0 + 20_000);
  const r = L.water(s, CENTER, T0 + 20_000); // còn 40 s ⇒ bớt 12 s
  assert.equal(r.saved, 12_000);
  assert.equal(p.readyAt, T0 + 48_000);
  assert.ok(L.progress(p, T0 + 20_000) >= before);
  assert.equal(L.water(s, CENTER, T0 + 21_000).err, "watered");
  const q = 6; L.plant(s, q, "rau-muong", T0);
  assert.equal(L.water(s, q, T0 + 20_000).err, "ready");
});

test("lên cấp: đủ XP thì lên, dư XP giữ lại; mở khoá Bắp ở cấp 2", () => {
  const s = L.newFarm(T0);
  assert.equal(L.xpNeed(1), 10);
  s.xp = 9; s.plots[CENTER] = { ...s.plots[CENTER], crop: "ca-rot", plantAt: T0, readyAt: T0 };
  const r = L.harvest(s, CENTER, T0);
  assert.equal(r.levelUp, 2); assert.equal(s.level, 2); assert.equal(s.xp, 2);
  assert.deepEqual(r.unlocked, ["bap"]);
  assert.ok(L.unlocked(s, "bap") && !L.unlocked(s, "bi-do"));
});

test("thu hoạch hết: chỉ lấy ô đã chín, cộng dồn đúng", () => {
  const s = L.newFarm(T0); s.coins = 100;
  L.plant(s, 6, "rau-muong", T0); L.plant(s, 7, "rau-muong", T0); L.plant(s, 8, "ca-rot", T0);
  const r = L.harvestAll(s, T0 + 20_000);
  assert.equal(r.count, 2); assert.equal(r.coins, 10); assert.deepEqual(r.plots, [6, 7]);
  assert.equal(s.plots[8].crop, "ca-rot");
});

test("mở ô: chỉ ô kề ô đã mở, giá tăng dần, thiếu tiền thì chặn", () => {
  const s = L.newFarm(T0); s.coins = 1000;
  assert.equal(L.canBuy(s, 0), false, "góc (0,0) chỉ kề chéo");
  assert.equal(L.buyPlot(s, 0).err, "far");
  assert.equal(L.canBuy(s, 1), true, "(1,0) kề (1,1)");
  assert.equal(L.plotCost(s), 30);
  assert.deepEqual(L.buyPlot(s, 1), { ok: true, cost: 30 });
  assert.equal(L.plotCost(s), 40);
  assert.equal(L.canBuy(s, 0), true, "giờ (0,0) kề (1,0)");
  assert.equal(L.buyPlot(s, CENTER).err, "open");
  s.coins = 5; assert.equal(L.buyPlot(s, 0).err, "coins");
});

test("vắng mặt: cây vẫn lớn theo đồng hồ thật, đếm ô chín trong lúc vắng", () => {
  const s = L.newFarm(T0);
  L.plant(s, 6, "rau-muong", T0); L.plant(s, 7, "ca-rot", T0);
  const back = L.load(L.dump(s, T0 + 1_000), T0 + 3_600_000);
  assert.equal(L.readyWhileAway(back, T0 + 3_600_000), 2);
  assert.equal(L.harvestAll(back, T0 + 3_600_000).count, 2);
});

test("đọc bản lưu: lưu rồi đọc ra giống hệt; bản hỏng / phiên bản lạ ⇒ ruộng mới", () => {
  const s = L.newFarm(T0); s.coins = 77; L.plant(s, CENTER, "ca-rot", T0); L.water(s, CENTER, T0 + 1000);
  const back = L.load(L.dump(s, T0 + 2000), T0 + 2000);
  assert.equal(back.coins, 72); assert.deepEqual(back.plots[CENTER], s.plots[CENTER]);
  for (const bad of ["{", "null", '{"v":99}', JSON.stringify({ v: 1, plots: [] }), 42]) assert.equal(L.load(bad, T0).coins, L.START_COINS, String(bad));
});

test("đọc bản lưu bị sửa: kẹp số âm / quá lớn, cây lạ bị bỏ, cây không kẹt quá một chu kỳ", () => {
  const s = L.newFarm(T0), d = JSON.parse(L.dump(s, T0));
  d.coins = -50; d.level = 0; d.xp = 1e9;
  d.plots[CENTER] = { open: true, crop: "ca-rot", plantAt: T0, readyAt: T0 + 1e12, watered: false };
  d.plots[6] = { open: true, crop: "hack", plantAt: 0, readyAt: 0 };
  const b = L.load(JSON.stringify(d), T0);
  assert.equal(b.coins, 0); assert.equal(b.level, 1); assert.ok(b.xp < L.xpNeed(1));
  assert.ok(b.plots[CENTER].readyAt <= T0 + L.CROP["ca-rot"].growMs);
  assert.equal(b.plots[6].crop, null);
  assert.equal(b.plots.filter((p) => p.open).length, 9, "ô giữa luôn mở");
});
