// Test luật + vật lý Đua Xe Vượt Đồi: node --test test/logic.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";
import { bot } from "../tools/sim.mjs";

const NONE = { gas: false, brake: false }, GAS = { gas: true, brake: false }, BRK = { gas: false, brake: true };
const run = (seed = 7, up = {}) => L.newRun(seed, up);
const steps = (s, inp, sec) => L.simulate(s, inp, sec);
// đường bằng phẳng (thay hàm độ cao để thử vật lý trên địa hình biết trước)
function flatRun(slopeDeg = 0, up = {}) {
  const s = run(1, up), k = Math.tan((slopeDeg * Math.PI) / 180);
  const T = s.terrain;
  T.ys = new Proxy([], { get: (a, p) => (p === "length" ? 1e9 : typeof p === "string" && /^\d+$/.test(p) ? Number(p) * L.DX * k : a[p]) });
  for (let c = 0; c < 200; c++) s.itemCache.set(c, []);
  L.setPose(s, L.START_X + 4, 0, Math.atan(k));
  return s;
}

test("địa hình tất định theo seed, liên tục, đầu đường bằng phẳng, đồi cao dần", () => {
  for (const x of [0, 10, 55.5, 300, 1234.25]) assert.equal(L.heightFn(9, x), L.heightFn(9, x));
  assert.notEqual(L.heightFn(9, 500), L.heightFn(10, 500));
  for (let x = 0; x <= 22; x += 0.5) assert.ok(L.heightFn(3, x) === 0, "đoạn xuất phát phẳng");
  assert.ok(L.heightFn(3, -2) > 2, "vách chặn phía sau");
  // liên tục: không có bước nhảy lớn giữa 2 mẫu
  // 1.2 km đầu dốc tối đa ~50°; xa hơn dốc gắt dần (độ khó) nhưng không thành vách thẳng đứng
  for (const sd of [1, 5, 9]) {
    let early = 0, late = 0;
    for (let x = 0; x < 6000; x += L.DX) {
      const j = Math.abs(L.heightFn(sd, x + L.DX) - L.heightFn(sd, x)) / L.DX;
      if (x < 1200) early = Math.max(early, j); else late = Math.max(late, j);
    }
    assert.ok(early < 1.2, "đầu đường không quá dốc: " + early);
    assert.ok(late < 2.6, "không có vách đứng: " + late);
  }
  // biên độ đồi tăng theo quãng đường
  const amp = (a, b) => { let lo = Infinity, hi = -Infinity; for (let x = a; x < b; x += 1) { const h = L.heightFn(5, x); lo = Math.min(lo, h); hi = Math.max(hi, h); } return hi - lo; };
  assert.ok(amp(1800, 2400) > amp(80, 680), "đồi xa cao hơn đồi đầu");
  assert.equal(L.difficulty(0), 0); assert.equal(L.difficulty(5000), 1);
  const T = L.makeTerrain(5);
  assert.ok(Math.abs(L.groundY(T, 100.25) - (L.heightFn(5, 100) * 0.5 + L.heightFn(5, 100.5) * 0.5)) < 1e-9, "nội suy tuyến tính");
});

test("xe đứng yên trên đất phẳng: 2 bánh chạm đất, không trôi, không lật", () => {
  const s = run();
  steps(s, NONE, 3);
  assert.equal(s.status, "run");
  assert.ok(s.wc[0] && s.wc[1], "hai bánh chạm đất");
  assert.ok(L.carSpeed(s) < 0.05, "đứng yên: " + L.carSpeed(s));
  assert.ok(Math.abs(L.carAngle(s)) < 0.02);
  assert.ok(!s.bc, "thân xe không chạm đất");
});

test("ga: xe tăng tốc tới vmax; phanh: dừng rồi lùi chậm", () => {
  const s = flatRun();
  steps(s, GAS, 1);
  const v1 = L.carVx(s);
  assert.ok(v1 > 3, "tăng tốc nhanh: " + v1);
  steps(s, GAS, 4);
  assert.ok(Math.abs(L.carVx(s) - s.cfg.vmax) < 0.6, "đạt tốc độ tối đa: " + L.carVx(s));
  steps(s, BRK, 2.2);
  assert.ok(Math.abs(L.carVx(s)) < 1, "phanh dừng xe: " + L.carVx(s));
  steps(s, BRK, 3);
  assert.ok(L.carVx(s) < -1 && L.carVx(s) > -s.cfg.vrev - 0.3, "dừng hẳn thì lùi chậm: " + L.carVx(s));
  assert.equal(s.status, "run");
});

test("thả trôi: không ga thì xe chậm dần trên đất phẳng, tự lăn xuống dốc", () => {
  const s = flatRun();
  steps(s, GAS, 2); const v = L.carVx(s);
  steps(s, NONE, 2);
  assert.ok(L.carVx(s) < v && L.carVx(s) > 0, "chậm dần do lực cản lăn");
  const d = flatRun(-12); // dốc xuống về phía trước
  steps(d, NONE, 2);
  assert.ok(L.carVx(d) > 2, "lăn xuống dốc: " + L.carVx(d));
});

test("độ bám giới hạn leo dốc: dốc gắt trượt bánh, nâng cấp lốp leo tốt hơn", () => {
  const climb = (deg, up) => { const s = flatRun(deg, up); steps(s, GAS, 4); return L.carX(s) - (L.START_X + 4); };
  assert.ok(climb(10, {}) > 15, "dốc vừa leo được");
  assert.ok(climb(25, {}) < 0, "dốc gắt xe chưa nâng cấp trượt lùi");
  const g0 = climb(20, {}), g5 = climb(20, { grip: 5 });
  assert.ok(g5 > g0 + 3, `lốp bám leo xa hơn: ${g0.toFixed(1)} → ${g5.toFixed(1)}`);
  const full = climb(20, { engine: 5, grip: 5 });
  assert.ok(full > g5 + 10, "động cơ + lốp tối đa leo dốc gắt tốt: " + full.toFixed(1));
});

test("ga khi bay làm ngóc đầu, phanh làm chúi đầu", () => {
  const a = run(), b = run();
  L.setPose(a, 40, 8, 0, 5, 0); L.setPose(b, 40, 8, 0, 5, 0);
  steps(a, GAS, 0.4); steps(b, BRK, 0.4);
  assert.ok(!a.wc[0] && !a.wc[1], "đang bay");
  assert.ok(L.carAngle(a) > 0.3, "ga: đầu xe ngóc lên " + L.carAngle(a));
  assert.ok(L.carAngle(b) < -0.3, "phanh: đầu xe chúi xuống " + L.carAngle(b));
});

test("lật xe: rơi ngửa chạm đầu → crash 'lat' rồi kết thúc sau 1.4 giây", () => {
  const s = run();
  L.setPose(s, 30, 1.5, Math.PI, 0, 0);
  steps(s, NONE, 1);
  assert.equal(s.status, "crash"); assert.equal(s.reason, "lat");
  assert.ok(s.events.some((e) => e.type === "crash"));
  steps(s, GAS, 0.2);
  assert.equal(s.status, "crash", "chưa kết thúc ngay để xem va chạm");
  const fuel = s.fuel; steps(s, GAS, 2);
  assert.equal(s.status, "over");
  assert.equal(s.fuel, fuel, "sau khi lật, ga không còn tác dụng");
  assert.ok(s.events.some((e) => e.type === "over" && e.reason === "lat"));
});

test("cứ giữ ga liên tục thì sớm muộn sẽ bốc đầu lật (cần điều khiển)", () => {
  let crashed = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const s = run(seed, { engine: 5, grip: 5, tank: 5 });
    steps(s, GAS, 300);
    if (s.reason === "lat") crashed++;
  }
  assert.ok(crashed >= 5, "xe mạnh + ga liên tục phần lớn bị lật: " + crashed);
});

test("nghiêng nhẹ khi đáp không bị tính là lật", () => {
  const s = run();
  L.setPose(s, 30, 2, 0.5, 4, 0);
  steps(s, NONE, 2);
  assert.equal(s.status, "run");
});

test("xăng: tiêu hao khi ga nhiều hơn khi thả; hết xăng + đứng yên → thua 'xang'", () => {
  const a = run(), b = run();
  steps(a, GAS, 3); steps(b, NONE, 3);
  assert.ok(100 - a.fuel > 2.4 * 3 && 100 - b.fuel < 1 * 3, `${a.fuel} / ${b.fuel}`);
  const s = run();
  s.fuel = 0.05;
  steps(s, GAS, 0.5);
  assert.equal(s.fuel, 0);
  steps(s, GAS, 3);
  assert.equal(s.status, "over"); assert.equal(s.reason, "xang");
  // hết xăng khi đang chạy nhanh: còn trớn, chưa thua ngay
  const m = flatRun(); steps(m, GAS, 4); m.fuel = 0; steps(m, NONE, 0.8);
  assert.equal(m.status, "run", "còn trớn thì chưa thua");
  steps(m, NONE, 12);
  assert.equal(m.status, "over"); assert.equal(m.reason, "xang");
});

test("can xăng: vị trí tăng khoảng cách dần, nhặt được thì đầy bình", () => {
  const s = run(4);
  const fx = L.fuelXs(s, 3000);
  assert.equal(fx[0], L.START_X + 110);
  for (let i = 1; i < fx.length; i++) assert.ok(fx[i] - fx[i - 1] >= 125 && fx[i] - fx[i - 1] <= 330);
  assert.ok(fx[fx.length - 1] - fx[fx.length - 2] > fx[1] - fx[0], "càng xa càng thưa");
  s.fuel = 20;
  L.setPose(s, fx[0] - 2.5, 0, 0, 6, 0);
  steps(s, GAS, 1);
  assert.equal(s.fuels, 1);
  assert.ok(s.fuel > s.cfg.fuelMax - 3);
  assert.ok(s.taken.has("f0"));
  assert.ok(s.events.some((e) => e.type === "fuel"));
});

test("xu: sinh cố định theo seed, không trùng can xăng, nhặt được cộng tiền", () => {
  const a = run(4), b = run(4);
  const ia = L.itemsNear(a, 0, 1500), ib = L.itemsNear(b, 0, 1500);
  assert.deepEqual(ia.map((i) => [i.id, i.x, i.v]), ib.map((i) => [i.id, i.x, i.v]));
  const coins = ia.filter((i) => i.kind === "coin"), fx = L.fuelXs(a, 1500);
  assert.ok(coins.length > 60, "đủ nhiều xu: " + coins.length);
  assert.ok(coins.every((c) => c.x >= L.START_X + 30 && fx.every((f) => Math.abs(f - c.x) >= 5)));
  assert.ok(coins.every((c) => [5, 10, 25].includes(c.v)));
  assert.ok(coins.filter((c) => c.x - L.START_X < 300).every((c) => c.v === 5), "đầu đường chỉ xu 5");
  const c0 = coins[0];
  L.setPose(a, c0.x - 4, 0, 0, 5, 0);
  steps(a, GAS, 2);
  assert.ok(a.picked >= 1 && a.coins >= 5, "nhặt được xu: " + a.picked);
  const near = L.itemsNear(a, c0.x - 10, c0.x + 30).map((i) => i.id);
  assert.ok([...a.taken].every((id) => !near.includes(id)), "đã nhặt thì biến mất");
});

test("quãng đường = điểm xa nhất đã tới; mốc mỗi 100 m; đổi vùng mỗi 400 m", () => {
  const s = run(2);
  L.setPose(s, L.START_X + 99.5, 0, 0, 6, 0);
  steps(s, GAS, 0.5);
  assert.ok(s.dist >= 100);
  assert.ok(s.events.some((e) => e.type === "mark" && e.d === 100));
  const d = s.dist;
  steps(s, BRK, 4); // lùi lại không làm giảm quãng đường
  assert.equal(s.dist >= d, true);
  const b = run(2);
  L.setPose(b, L.START_X + 399.6, 0, 0, 6, 0);
  steps(b, GAS, 0.4);
  assert.ok(b.events.some((e) => e.type === "biome" && e.b === 1));
  assert.equal(L.biomeAt(0), 0); assert.equal(L.biomeAt(400), 1); assert.equal(L.biomeAt(1600), 0);
});

test("lộn vòng trên không được thưởng 50 xu, bay lâu được thưởng thêm", () => {
  // bay > 1 giây → thưởng theo thời gian bay
  const s = run(3);
  L.setPose(s, 60, 8, 0, 4, 6);
  const c0 = s.coins;
  steps(s, NONE, 3);
  const air = s.events.find((e) => e.type === "air");
  assert.ok(air && air.t >= 1 && air.v === Math.round(air.t * 10), JSON.stringify(s.events.map((e) => e.type)));
  assert.equal(s.status, "run");
  // đã quay đủ 1 vòng khi đang bay rồi đáp bằng bánh → thưởng lộn vòng
  const f = run(3);
  L.setPose(f, 60, 8, 0, 4, 6);
  for (let i = 0; i < 20; i++) L.substep(f, NONE);
  f.flipAcc += 2 * Math.PI;
  steps(f, NONE, 3);
  const flip = f.events.find((e) => e.type === "flip");
  assert.ok(flip && flip.n === 1 && flip.v === 50, JSON.stringify(f.events.map((e) => e.type)));
  assert.equal(f.flips, 1);
  assert.ok(f.coins >= 50 + c0);
});

test("nâng cấp: giá tăng dần, hiệu quả đúng, tối đa 5 cấp", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(L.upgradeCost), [150, 350, 700, 1200, 2000, null]);
  const c0 = L.carCfg({}), c5 = L.carCfg({ engine: 5, grip: 5, tank: 5 });
  assert.ok(c5.vmax > c0.vmax && c5.force > c0.force && c5.mu > c0.mu && c5.fuelMax === 225);
  const save = L.sanitizeSave({ coins: 500 });
  assert.equal(L.buyUpgrade(save, "engine"), true);
  assert.equal(save.coins, 350); assert.equal(save.up.engine, 1);
  assert.equal(L.buyUpgrade(save, "engine"), true);
  assert.equal(save.coins, 0); assert.equal(save.up.engine, 2);
  assert.equal(L.buyUpgrade(save, "engine"), false, "không đủ tiền");
  assert.equal(L.buyUpgrade(save, "nitro"), false, "loại không tồn tại");
  const full = L.sanitizeSave({ coins: 1e6, up: { tank: 5 } });
  assert.equal(L.buyUpgrade(full, "tank"), false, "đã tối đa");
  // bình to chạy lâu hơn
  const a = run(1), b = run(1, { tank: 5 });
  steps(a, GAS, 30); steps(b, GAS, 30);
  assert.ok(b.fuel / b.cfg.fuelMax > a.fuel / a.cfg.fuelMax);
});

test("lưu trữ: làm sạch dữ liệu hỏng, kết thúc ván cộng ví + cập nhật kỷ lục", () => {
  assert.deepEqual(L.sanitizeSave(null), { v: 1, best: 0, coins: 0, runs: 0, up: { engine: 0, grip: 0, tank: 0 } });
  const z = L.sanitizeSave({ best: "abc", coins: -5, runs: 2.7, up: { engine: 99, grip: -1, tank: "3" } });
  assert.deepEqual(z, { v: 1, best: 0, coins: 0, runs: 2, up: { engine: 5, grip: 0, tank: 3 } });
  const save = L.sanitizeSave({ best: 300, coins: 10 });
  const s = run(); s.dist = 250; s.coins = 40;
  let r = L.finishRun(save, s);
  assert.deepEqual(r, { record: false, prev: 300, dist: 250, coins: 40 });
  assert.equal(save.coins, 50); assert.equal(save.best, 300); assert.equal(save.runs, 1);
  s.dist = 420; r = L.finishRun(save, s);
  assert.equal(r.record, true); assert.equal(save.best, 420);
});

test("tất định: cùng seed + cùng thao tác → cùng kết quả; update() theo thời gian thực = simulate()", () => {
  const play = () => { const s = run(77); for (let i = 0; i < 120 * 40 && s.status !== "over"; i++) L.substep(s, bot(s)); return [s.dist, s.coins, s.fuel, L.carX(s)]; };
  assert.deepEqual(play(), play());
  const a = run(5), b = run(5);
  for (let i = 0; i < 300; i++) L.update(a, GAS, 1 / 60);
  steps(b, GAS, 300 / 60);
  assert.ok(Math.abs(L.carX(a) - L.carX(b)) < 1e-9);
  assert.equal(L.update(a, GAS, 5), 12, "khung hình bị treo lâu: chỉ tua tối đa 0.1 giây");
});

test("bot mô phỏng chơi được xa (game không quá khó), không có NaN", () => {
  let total = 0;
  for (let seed = 1; seed <= 4; seed++) {
    const s = run(seed);
    for (let i = 0; i < 120 * 400 && s.status !== "over"; i++) L.substep(s, bot(s));
    for (const p of s.p) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    total += s.dist;
  }
  assert.ok(total / 4 > 500, "bot đi trung bình > 500 m: " + total / 4);
});

test("fuzz: thao tác ngẫu nhiên không làm vật lý nổ (NaN / xuyên đất)", () => {
  let r = 12345;
  const rnd = () => ((r = (Math.imul(r, 1103515245) + 12345) >>> 0) / 4294967296);
  for (let seed = 1; seed <= 5; seed++) {
    const s = run(seed, { engine: seed % 6, grip: (seed * 2) % 6 });
    let inp = NONE;
    for (let i = 0; i < 120 * 60 && s.status !== "over"; i++) {
      if (i % 30 === 0) { const k = rnd(); inp = k < 0.55 ? GAS : k < 0.75 ? BRK : NONE; }
      L.substep(s, inp);
      for (const p of s.p) {
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
        assert.ok(p.y > L.groundY(s.terrain, p.x) - 0.3, "không chui xuống đất");
      }
    }
  }
});
