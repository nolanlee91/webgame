// Chạy: node --test prototype/games/dao-vang/test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { W, H, CFG, KINDS, createGame, step, fire, nextLevel, restart, tipOf, targetFor, drainEvents } from "../logic.js";

const DT = 1 / 60;
const run = (g, sec) => { for (let i = 0; i < Math.round(sec / DT); i++) step(g, DT); return g; };
// Màn chơi tự dựng: chỉ đặt đúng các vật thể cần test.
function arena(objs, players = 1) {
  const g = createGame({ players, seed: 1 });
  g.objects = objs.map((o, i) => ({ id: i + 1, r: KINDS[o.kind].r, ...o }));
  g.hooks.forEach((h) => { h.phase = 0; h.angle = 0; });
  return g;
}
// Thả móc thẳng đứng và chạy đến khi móc quay về; trả về số giây.
function dropStraight(g, i = 0) {
  const h = g.hooks[i];
  h.phase = 0; h.angle = 0;
  fire(g, i);
  let t = 0;
  while (h.state !== "swing" && t < 30) { step(g, DT); t += DT; }
  return t;
}

test("cùng seed → cùng màn chơi; khác seed → khác", () => {
  const a = createGame({ seed: 42 }), b = createGame({ seed: 42 }), c = createGame({ seed: 43 });
  assert.deepEqual(a.objects, b.objects);
  assert.notDeepEqual(a.objects, c.objects);
});

test("vật thể nằm trong hang, dưới mặt đất, không chồng lên nhau", () => {
  for (let seed = 1; seed <= 30; seed++) for (const level of [1, 3, 6]) {
    const g = createGame({ seed, level });
    for (const o of g.objects) {
      assert.ok(o.x - o.r >= 0 && o.x + o.r <= W && o.y + o.r <= H && o.y - o.r > CFG.groundY, `seed ${seed} lv ${level}: ${o.kind} ra ngoài`);
      for (const p of g.objects) if (p !== o) assert.ok(Math.hypot(o.x - p.x, o.y - p.y) > o.r + p.r, "chồng nhau");
    }
  }
});

test("màn nào cũng đủ điểm để qua (tổng giá trị ≥ điểm cần thêm)", () => {
  for (let seed = 1; seed <= 50; seed++) for (let level = 1; level <= 8; level++) {
    const g = createGame({ seed, level });
    const total = g.objects.reduce((s, o) => s + (o.kind === "bag" ? 30 : KINDS[o.kind].value), 0);
    assert.ok(total >= targetFor(level) - targetFor(level - 1), `seed ${seed} lv ${level}: ${total}`);
  }
});

test("móc lắc qua lại trong giới hạn góc khi chưa thả", () => {
  const g = createGame({ seed: 5 });
  let min = 0, max = 0;
  for (let i = 0; i < 400; i++) { step(g, DT); min = Math.min(min, g.hooks[0].angle); max = Math.max(max, g.hooks[0].angle); }
  assert.ok(max > CFG.maxAngle * 0.95 && min < -CFG.maxAngle * 0.95);
  assert.ok(max <= CFG.maxAngle + 1e-9 && min >= -CFG.maxAngle - 1e-9);
  assert.equal(g.hooks[0].state, "swing");
});

test("thả móc: dây dài ra, góc giữ nguyên; không thả lần 2 khi đang thả", () => {
  const g = arena([]);
  assert.equal(fire(g), true);
  const a = g.hooks[0].angle;
  run(g, 0.3);
  assert.equal(g.hooks[0].state, "out");
  assert.ok(g.hooks[0].len > CFG.ropeMin + 100);
  assert.equal(g.hooks[0].angle, a);
  assert.equal(fire(g), false);
});

test("móc trượt: chạm đáy rồi thu về rỗng, không cộng điểm", () => {
  const g = arena([]);
  dropStraight(g);
  assert.equal(g.score, 0);
  assert.equal(g.hooks[0].state, "swing");
  assert.equal(g.hooks[0].len, CFG.ropeMin);
});

test("va chạm vàng: móc gắp, kéo về và cộng đúng điểm", () => {
  const g = arena([{ kind: "goldM", x: W / 2, y: 400 }]);
  dropStraight(g);
  assert.equal(g.score, 150);
  assert.equal(g.objects.length, 0);
  const ev = drainEvents(g).map((e) => e.type);
  assert.ok(ev.includes("grab") && ev.includes("collect"));
});

test("vật nặng kéo về chậm hơn vật nhẹ ở cùng độ sâu", () => {
  const t = {};
  for (const kind of ["diamond", "goldS", "goldL", "rockL"]) t[kind] = dropStraight(arena([{ kind, x: W / 2, y: 420 }]));
  assert.ok(t.diamond < t.goldS && t.goldS < t.goldL && t.goldL < t.rockL, JSON.stringify(t));
});

test("đá cho ít điểm; kim cương cho nhiều điểm", () => {
  const a = arena([{ kind: "rockL", x: W / 2, y: 400 }]); dropStraight(a);
  const b = arena([{ kind: "diamond", x: W / 2, y: 400 }]); dropStraight(b);
  assert.equal(a.score, 60); assert.equal(b.score, 600);
});

test("móc chỉ gắp vật đầu tiên chạm phải", () => {
  const g = arena([{ kind: "goldS", x: W / 2, y: 300 }, { kind: "goldL", x: W / 2, y: 480 }]);
  dropStraight(g);
  assert.equal(g.score, 50);
  assert.equal(g.objects.length, 1);
});

test("móc thả xiên trúng vật nằm lệch", () => {
  const g = arena([{ kind: "goldM", x: W / 2 + 200, y: 400 }]);
  const h = g.hooks[0];
  h.angle = Math.atan2(200, 400 - CFG.pivotY);
  h.state = "out";
  while (h.state !== "swing") step(g, DT);
  assert.equal(g.score, 150);
});

test("túi bí ẩn cho điểm ngẫu nhiên trong danh sách", () => {
  const g = arena([{ kind: "bag", x: W / 2, y: 400 }]);
  dropStraight(g);
  assert.ok([30, 80, 150, 250, 400, 700].includes(g.score), String(g.score));
});

test("TNT nổ: phá vật thể trong bán kính, giữ vật ở xa, móc về rỗng", () => {
  const g = arena([
    { kind: "tnt", x: W / 2, y: 400 },
    { kind: "goldL", x: W / 2 + 80, y: 420 },
    { kind: "diamond", x: W / 2 + 330, y: 400 },
  ]);
  dropStraight(g);
  assert.equal(g.score, 0);
  assert.deepEqual(g.objects.map((o) => o.kind), ["diamond"]);
  assert.ok(drainEvents(g).some((e) => e.type === "boom" && e.destroyed === 2));
});

test("đồng hồ đếm ngược; hết giờ mà thiếu điểm → thua", () => {
  const g = createGame({ seed: 9 });
  run(g, 10);
  assert.ok(Math.abs(g.time - (CFG.levelTime - 10)) < 0.05);
  run(g, CFG.levelTime);
  assert.equal(g.time, 0);
  assert.equal(g.status, "failed");
  const t = g.tick; step(g, DT); assert.equal(g.tick, t, "dừng hẳn sau khi kết thúc");
  assert.equal(fire(g), false);
});

test("hết giờ mà đủ điểm → qua màn, sang màn mới giữ điểm và mục tiêu tăng", () => {
  const g = createGame({ seed: 9 });
  g.score = g.target + 10;
  run(g, CFG.levelTime + 1);
  assert.equal(g.status, "cleared");
  const n = nextLevel(g);
  assert.equal(n.level, 2); assert.equal(n.score, g.score); assert.equal(n.status, "playing");
  assert.ok(n.target > g.target); assert.equal(n.time, CFG.levelTime);
  assert.ok(n.objects.some((o) => o.kind === "tnt"), "màn 2 có TNT");
});

test("gom hết vật có giá trị → kết thúc màn sớm", () => {
  const g = arena([{ kind: "diamond", x: W / 2, y: 300 }, { kind: "rockS", x: 100, y: 500 }]);
  g.score = g.target - 100;
  dropStraight(g);
  step(g, DT);
  assert.equal(g.status, "cleared");
  assert.ok(g.time > CFG.levelTime - 5);
});

test("thua → chơi lại từ màn 1, điểm 0", () => {
  const g = createGame({ seed: 3, level: 3, score: 999 });
  g.status = "failed";
  const r = restart(g);
  assert.equal(r.level, 1); assert.equal(r.score, 0); assert.equal(r.status, "playing");
});

test("2 người: 2 móc độc lập, chung điểm, ghi nhận từng người", () => {
  const g = arena([{ kind: "goldM", x: W * 0.3, y: 400 }, { kind: "diamond", x: W * 0.7, y: 400 }], 2);
  assert.equal(g.hooks.length, 2);
  fire(g, 0);
  step(g, DT);
  assert.equal(g.hooks[0].state, "out");
  assert.equal(g.hooks[1].state, "swing", "P2 không bị ảnh hưởng");
  fire(g, 1);
  run(g, 8);
  assert.equal(g.score, 750);
  assert.equal(g.hooks[0].earned, 150);
  assert.equal(g.hooks[1].earned, 600);
});

test("2 người: hai móc không gắp trùng một vật", () => {
  const g = arena([{ kind: "goldL", x: W / 2, y: 450 }], 2);
  for (const [i, h] of g.hooks.entries()) { h.angle = Math.atan2(W / 2 - h.x, 450 - CFG.pivotY); h.state = "out"; }
  run(g, 15);
  assert.equal(g.score, 500);
  assert.equal(g.hooks[0].earned + g.hooks[1].earned, 500);
});

test("đầu móc tính đúng theo góc và độ dài dây", () => {
  const h = { x: 100, y: 100, angle: Math.PI / 2, len: 50 };
  const t = tipOf(h);
  assert.ok(Math.abs(t.x - 150) < 1e-9 && Math.abs(t.y - 100) < 1e-9);
});
