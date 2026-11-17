import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";
const { W, N, newGame, gridFrom, neighbors, center, trace, shoot, angleTo, serialize, deserialize, presentKinds, swapBalls, bubbles, lowestRow, EGG, STONE, BOMB, LOSE_ROW } = L;
const blank = (o = {}) => newGame({ level: 1, seed: 5, ...o });
const at = (r, c) => r * W + c;
const sorted = (a) => [...a].sort((x, y) => x - y);
// góc bắn thẳng vào tâm ô i
const aimAt = (s, i) => angleTo(...center(s, i));

test("hàng xóm lục giác đúng cho hàng lệch và không lệch", () => {
  const s = blank(); gridFrom(s, []);
  assert.deepEqual(sorted(neighbors(s, at(2, 5))), sorted([at(1, 4), at(1, 5), at(2, 4), at(2, 6), at(3, 4), at(3, 5)]));
  assert.deepEqual(sorted(neighbors(s, at(1, 5))), sorted([at(0, 5), at(0, 6), at(1, 4), at(1, 6), at(2, 5), at(2, 6)]));
  assert.ok(!neighbors(s, at(1, W - 2)).includes(at(1, W - 1)), "hàng lệch chỉ có W-1 ô");
  // mọi cặp hàng xóm cách nhau đúng 1 đường kính
  for (let i = 0; i < N; i++) {
    if (!L.valid(s, L.R(i), L.C(i))) continue;
    const [x, y] = center(s, i);
    for (const j of neighbors(s, i)) { const [u, v] = center(s, j); assert.ok(Math.abs(Math.hypot(u - x, v - y) - 1) < 1e-9); }
  }
  s.par = 1;
  assert.equal(L.rowLen(s, 0), W - 1); assert.equal(L.rowLen(s, 1), W);
});

test("bắn thẳng lên trần thì dính hàng 0, không nảy", () => {
  const s = blank(); gridFrom(s, ["1"], { cur: 0, next: 0 });
  const t = trace(s, Math.PI / 2);
  assert.equal(L.R(t.at), 0); assert.equal(L.C(t.at), 5);
  assert.equal(t.path.length, 2);
});

test("bắn chéo nảy tường, hai bên đối xứng", () => {
  const s = blank(); gridFrom(s, ["1"]);
  const t = trace(s, (20 * Math.PI) / 180);
  assert.ok(t.path.length >= 3, "phải có điểm nảy");
  assert.ok(Math.abs(t.path[1][0] - (W - 0.5)) < 1e-9, "nảy ở tường phải");
  const t2 = trace(s, Math.PI - (20 * Math.PI) / 180);
  assert.ok(Math.abs(t2.path[1][0] - 0.5) < 1e-9, "nảy ở tường trái");
  assert.equal(L.R(t.at), L.R(t2.at));
  // góc ngoài giới hạn bị kẹp lại
  assert.deepEqual(trace(s, 0).path[1], trace(s, L.MIN_A).path[1]);
});

test("viên bắn dính vào ô trống kề bóng đã có", () => {
  const s = blank(); gridFrom(s, ["00000000000", "1111111111", "22222222222"]);
  const t = trace(s, Math.PI / 2);
  assert.equal(L.R(t.at), 3);
  assert.ok(neighbors(s, t.at).some((j) => s.grid[j]));
  assert.equal(s.grid[t.at], null);
});

test("3 viên cùng màu thì nổ, 2 viên thì không", () => {
  // ô (2,5) kề (1,4) và (1,5)
  const s = blank(); gridFrom(s, ["22222222222", "2222002222"], { cur: 0, next: 1 });
  const r = shoot(s, aimAt(s, at(2, 5)));
  assert.equal(r.at, at(2, 5));
  assert.equal(r.popped.length, 3); assert.equal(s.grid[at(1, 4)], null);
  assert.equal(s.misses, 0);
  const s2 = newGame({ level: 2, seed: 5 }); gridFrom(s2, ["22222222222", "2222202222"], { cur: 0, next: 1 }); s2.eggsLeft = 1;
  const r2 = shoot(s2, aimAt(s2, at(2, 5)));
  assert.equal(r2.popped.length, 0); assert.ok(s2.grid[at(1, 4)]);
  assert.equal(s2.misses, 1);
});

test("bóng mất chỗ bám thì rơi, trứng rơi cũng được cứu → thắng", () => {
  // (1,4) màu 0 bám vào (0,4)=1 và (0,5)=0; bên dưới treo (2,4)=3 và trứng (3,3)
  const s = blank(); gridFrom(s, ["11111011111", "....0.....", "....3......", "...b......"], { cur: 0, next: 0 });
  const r = shoot(s, aimAt(s, at(1, 5)));
  assert.equal(r.at, at(1, 5));
  assert.equal(r.popped.length, 3, "nhóm màu 0 nổ");
  const dropAt = r.dropped.map((d) => d.at);
  assert.ok(dropAt.includes(at(2, 4)) && dropAt.includes(at(3, 3)), "phần bên dưới rơi");
  assert.equal(r.eggs, 1); assert.equal(s.eggsLeft, 0);
  assert.equal(s.status, "won");
});

test("trứng nổ cùng nhóm màu cũng được cứu, điểm đúng công thức", () => {
  const s = blank(); gridFrom(s, ["11111111111", "1111aa1111"], { cur: 0, next: 0 });
  s.eggsLeft = 3; s.eggsTotal = 3; // còn 1 trứng ở nơi khác để chưa thắng
  const r = shoot(s, aimAt(s, at(2, 5)));
  assert.equal(r.at, at(2, 5));
  assert.equal(r.popped.length, 3); assert.equal(r.eggs, 2); assert.equal(s.eggsLeft, 1);
  assert.equal(s.status, "playing");
  assert.equal(r.pts, 3 * 10 + 2 * 100);
});

test("đá không nổ theo màu, chỉ rơi khi mất chỗ bám", () => {
  const s = blank(); gridFrom(s, ["11111011111", "....0.....", "....#......"], { cur: 0, next: 0 });
  s.eggsLeft = 1;
  const r = shoot(s, aimAt(s, at(1, 5)));
  assert.ok(r.popped.length === 3 && r.popped.every((p) => p.t !== STONE));
  assert.ok(r.dropped.some((d) => d.t === STONE));
  // đá kề nhóm màu nhưng còn bám trần thì giữ nguyên
  const t = blank(); gridFrom(t, ["#1111011111", "0...0....."], { cur: 0, next: 0 }); t.eggsLeft = 1;
  shoot(t, aimAt(t, at(1, 5)));
  assert.equal(t.grid[at(0, 0)].t, STONE);
});

test("chạm bom thì nổ vùng quanh bom, bom nổ dây chuyền", () => {
  const s = blank(); gridFrom(s, ["11111111111", "2222*22222", "33333*33333"], { cur: 0, next: 0 });
  s.eggsLeft = 1;
  const r = shoot(s, aimAt(s, at(3, 5)));
  assert.equal(r.at, at(3, 5));
  assert.equal(r.bombs.length, 2, "2 bom");
  assert.ok(!s.grid[at(1, 4)] && !s.grid[at(0, 4)] && !s.grid[at(0, 5)]);
  assert.equal(r.popped.length, 9, "viên bắn + 2 bom + 6 bóng quanh bom");
  assert.equal(s.misses, 0);
});

test("bắn hụt đủ số lần thì trần thêm hàng, đổi chẵn lẻ, giữ bóng cũ", () => {
  const s = newGame({ level: 2, seed: 3 }); gridFrom(s, ["11111111111", "2222c22222"], { cur: 0, next: 0 });
  s.push = 2;
  shoot(s, Math.PI / 2); assert.equal(s.misses, 1);
  const before = s.grid.filter(Boolean).map((b) => b.id);
  const r = shoot(s, (70 * Math.PI) / 180);
  assert.ok(r.pushed); assert.equal(r.pushed.length, W - 1);
  assert.equal(s.par, 1); assert.equal(s.misses, 0);
  for (const id of before) assert.ok(s.grid.some((b) => b && b.id === id));
  assert.equal(L.rowLen(s, 0), W - 1);
  assert.equal(s.grid.slice(0, W).filter(Boolean).length, W - 1);
  assert.ok(deserialize(serialize(s)), "sau khi đẩy hàng vẫn hợp lệ");
});

test("bóng chạm vạch đỏ là thua", () => {
  const s = newGame({ level: 2, seed: 3 });
  const rows = []; for (let r = 0; r < LOSE_ROW; r++) rows.push(r % 2 ? "1".repeat(W - 1) : "2".repeat(W));
  gridFrom(s, rows, { cur: 3, next: 3 }); s.eggsLeft = 1; s.kinds = 4;
  const r = shoot(s, Math.PI / 2);
  assert.equal(L.R(r.at), LOSE_ROW); assert.equal(s.status, "lost"); assert.equal(r.reason, "line");
});

test("hết viên mà chưa cứu hết trứng là thua", () => {
  const s = blank(); gridFrom(s, ["a1111111111", "2222222222"], { cur: 1, next: 1 });
  s.shots = 1;
  const r = shoot(s, Math.PI / 2);
  assert.equal(s.status, "lost"); assert.equal(r.reason, "shots");
  assert.equal(shoot(s, Math.PI / 2), null, "hết ván thì không bắn được nữa");
});

test("cứu hết trứng thì thắng, thưởng viên dư và tính sao", () => {
  const mk = (left) => { const t = blank(); gridFrom(t, ["11111001111", "....a....."], { cur: 0, next: 0 }); t.shotsMax = 20; t.shots = left + 1; return t; };
  const s = mk(19); const sc0 = s.score;
  const r = shoot(s, aimAt(s, at(0, 5)));
  assert.equal(s.status, "won"); assert.equal(s.shots, 19);
  assert.equal(r.bonus, 19 * L.SHOT_BONUS); assert.equal(s.stars, 3);
  assert.equal(s.score - sc0, r.pts + r.bonus);
  for (const [left, st] of [[1, 1], [3, 2], [7, 3]]) { const t = mk(left); shoot(t, aimAt(t, at(0, 5))); assert.equal(t.status, "won"); assert.equal(t.stars, st, `còn ${left}`); }
});

test("viên kế tiếp chỉ lấy màu còn trên bàn; đổi viên", () => {
  const s = newGame({ level: 2, seed: 4 }); gridFrom(s, ["00000000000", "2222222222", "...1......."], { cur: 2, next: 0 });
  s.eggsLeft = 1; s.push = 0;
  assert.deepEqual(presentKinds(s), [0, 1, 2]);
  for (let n = 0; n < 8 && s.status === "playing"; n++) {
    shoot(s, ((50 + n * 10) * Math.PI) / 180);
    const ks = presentKinds(s);
    if (s.status === "playing") { assert.ok(ks.includes(s.cur), "cur có trên bàn"); assert.ok(ks.includes(s.next), "next có trên bàn"); }
  }
  const t = blank(); t.cur = 1; t.next = 2; assert.ok(swapBalls(t)); assert.equal(t.cur, 2); assert.equal(t.next, 1);
});

test("Tự do: không giới hạn viên, dọn sạch thì thưởng 500 và có bàn mới", () => {
  const s = newGame({ mode: "free", seed: 9 });
  assert.equal(s.shots, null);
  gridFrom(s, ["00........."], { cur: 0, next: 0 });
  const r = shoot(s, aimAt(s, at(0, 2)));
  assert.equal(r.bonus, 500); assert.ok(r.refill.length > 20); assert.equal(s.status, "playing");
  assert.equal(s.refills, 1); assert.ok(bubbles(s) > 20);
  assert.ok(deserialize(serialize(s)));
});

test("tạo màn: đúng số trứng/đá/bom, bàn hợp lệ, cùng seed thì giống hệt", () => {
  for (let lv = 1; lv <= L.LEVELS.length; lv++) {
    const cfg = L.LEVELS[lv - 1], s = newGame({ level: lv, seed: 77 + lv });
    const cnt = (t) => s.grid.filter((b) => b && b.t === t).length;
    assert.equal(cnt(EGG), cfg.eggs); assert.equal(cnt(STONE), cfg.stones); assert.equal(cnt(BOMB), cfg.bombs);
    assert.equal(lowestRow(s), cfg.rows - 1);
    assert.ok(deserialize(serialize(s)), "bàn mới phải hợp lệ khi lưu/nạp");
    assert.deepEqual(serialize(newGame({ level: lv, seed: 77 + lv })), serialize(s));
  }
  assert.throws(() => newGame({ level: 99 }));
});

test("lưu/nạp giữ nguyên ván, chặn dữ liệu hỏng", () => {
  const s = newGame({ level: 5, seed: 12 });
  for (let n = 0; n < 3; n++) shoot(s, L.bestShot(s, 40).a);
  assert.equal(s.status, "playing");
  const d = JSON.parse(JSON.stringify(serialize(s)));
  const t = deserialize(d);
  assert.deepEqual(serialize(t), serialize(s));
  const a = L.bestShot(s, 30).a; shoot(s, a); shoot(t, a);
  assert.deepEqual(serialize(t), serialize(s), "chơi tiếp giống hệt");
  const bad = (f) => { const x = JSON.parse(JSON.stringify(d)); f(x); return deserialize(x); };
  assert.equal(bad((x) => (x.v = 2)), null);
  assert.equal(bad((x) => (x.level = 99)), null);
  assert.equal(bad((x) => (x.grid.length = 5)), null);
  assert.equal(bad((x) => (x.grid[x.grid.findIndex((v) => v && v[1] === 0)][0] = 9)), null);
  assert.equal(bad((x) => (x.shots = 0)), null);
  assert.equal(bad((x) => (x.eggsLeft = x.eggsLeft + 1)), null);
  assert.equal(bad((x) => (x.cur = -1)), null);
  assert.equal(bad((x) => (x.status = "won")), null);
  assert.equal(bad((x) => (x.misses = 99)), null);
  assert.equal(bad((x) => { x.grid[W * 11 + 3] = [0, 0]; }), null, "bóng lơ lửng");
  assert.equal(deserialize(null), null); assert.equal(deserialize("rác"), null);
});

test("fuzz: bắn ngẫu nhiên nhiều ván, bất biến luôn đúng", () => {
  for (let g = 0; g < 40; g++) {
    const free = g % 5 === 0;
    const s = newGame(free ? { mode: "free", seed: g } : { level: 1 + (g % 12), seed: g * 31 });
    let rs = g + 1; const rnd = () => (rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let n = 0; n < 60 && s.status === "playing"; n++) {
      const before = bubbles(s), egg0 = s.eggsLeft, sc0 = s.score;
      const r = shoot(s, L.MIN_A + rnd() * (L.MAX_A - L.MIN_A));
      for (let i = 0; i < N; i++) if (s.grid[i]) assert.ok(L.valid(s, L.R(i), L.C(i)), "ô hợp lệ");
      if (s.status === "playing") assert.ok(deserialize(serialize(s)), "trạng thái hợp lệ");
      if (!r.refill && s.status !== "lost") assert.equal(bubbles(s), before + 1 - r.popped.length - r.dropped.length + (r.pushed ? r.pushed.length : 0));
      assert.equal(egg0 - s.eggsLeft, Math.min(egg0, r.eggs));
      assert.ok(s.score >= sc0);
      if (s.status === "playing" && !free) { assert.ok(s.shots > 0); assert.ok(s.eggsLeft > 0); }
      assert.ok(r.path.length >= 2);
    }
  }
});
