// Chạy: node --test test/logic.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";

const place = (s, x, y) => { s.food = { x, y }; };

test("ván mới: rắn dài 4 nằm ngang, hướng phải, mồi không trùng thân; cùng seed ra cùng mồi", () => {
  const s = L.newGame({ seed: 7 });
  assert.equal(s.snake.length, L.START_LEN);
  assert.deepEqual(s.snake[0], { x: 6, y: 10 });
  assert.equal(s.dir, "right");
  assert.ok(!s.snake.some((c) => c.x === s.food.x && c.y === s.food.y));
  assert.deepEqual(L.newGame({ seed: 7 }).food, s.food);
});

test("di chuyển + đổi hướng: không quay đầu 180°, xếp hàng tối đa 2 lần bấm", () => {
  const s = L.newGame({ seed: 1 }); place(s, 0, 0);
  assert.equal(L.turn(s, "left"), false, "quay đầu bị chặn");
  assert.equal(L.turn(s, "right"), false, "bấm trùng hướng bỏ qua");
  assert.equal(L.turn(s, "up"), true);
  assert.equal(L.turn(s, "left"), true, "lên rồi trái (khác 180° so với lên)");
  assert.equal(L.turn(s, "down"), false, "hàng chờ đầy / quay đầu so với trái");
  L.step(s); assert.deepEqual(s.snake[0], { x: 6, y: 9 });
  L.step(s); assert.deepEqual(s.snake[0], { x: 5, y: 9 });
  assert.equal(s.snake.length, 4);
});

test("ăn mồi: dài thêm 1, cộng điểm theo cấp tốc độ, mồi mới xuất hiện ở ô trống", () => {
  const s = L.newGame({ seed: 2 }); place(s, 7, 10);
  const ev = L.step(s);
  assert.equal(ev.ate, "food"); assert.equal(ev.pts, 10);
  assert.equal(s.snake.length, 5); assert.equal(s.score, 10); assert.equal(s.eaten, 1);
  assert.ok(s.food && !s.snake.some((c) => c.x === s.food.x && c.y === s.food.y));
});

test("tốc độ tăng theo độ dài, chạm sàn 55ms; cấp tốc độ mỗi 5 ô", () => {
  const s = L.newGame({ seed: 3 });
  assert.equal(L.interval(s), 160); assert.equal(L.speedLevel(s), 1);
  for (let i = 0; i < 10; i++) s.snake.push({ x: 0, y: 0 });
  assert.equal(L.interval(s), 128); assert.equal(L.speedLevel(s), 3);
  for (let i = 0; i < 100; i++) s.snake.push({ x: 0, y: 0 });
  assert.equal(L.interval(s), 55);
});

test("Cổ điển: đụng tường là thua; Xuyên tường: đi sang mép đối diện", () => {
  const a = L.newGame({ seed: 4 }); place(a, 0, 0);
  let ev; for (let i = 0; i < 20 && a.status === "play"; i++) ev = L.step(a);
  assert.equal(a.status, "over"); assert.ok(ev.died); assert.equal(a.died.by, "wall"); assert.equal(a.died.x, L.N);
  const b = L.newGame({ seed: 4, mode: "wrap" }); place(b, 0, 0);
  for (let i = 0; i < 14; i++) L.step(b);
  assert.equal(b.status, "play"); assert.deepEqual(b.snake[0], { x: 0, y: 10 });
});

test("cắn vào thân là thua; được đi vào ô đuôi vừa rời đi", () => {
  const s = L.newGame({ seed: 5 }); place(s, 0, 0);
  s.snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }];
  s.dir = "up"; L.turn(s, "left"); // đầu sang (4,5) = thân ⇒ chết
  // thay vào: rắn 4 đốt vòng kín — đi vào ô đuôi hợp lệ
  const t = L.newGame({ seed: 5 }); place(t, 0, 0);
  t.snake = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 5 }]; t.dir = "up"; L.turn(t, "left");
  L.step(t); assert.equal(t.status, "play", "đuổi theo đuôi không chết");
  s.queue = []; s.dir = "down"; // đầu xuống (5,6) = thân
  const ev = L.step(s);
  assert.ok(ev.died); assert.equal(s.died.by, "self"); assert.equal(s.status, "over");
  assert.equal(L.step(s).died, false, "đã thua thì không chạy tiếp");
  assert.equal(L.turn(s, "left"), false);
});

test("mồi vàng: xuất hiện sau mỗi 5 mồi, ăn được +50×cấp và dài thêm 2, hết hạn thì biến mất", () => {
  const s = L.newGame({ seed: 6, mode: "wrap" });
  for (let i = 0; i < 5; i++) { const h = s.snake[0]; s.food = { x: (h.x + 1) % L.N, y: h.y }; L.step(s); }
  assert.equal(s.eaten, 5); assert.ok(s.gold); assert.equal(s.gold.life, L.GOLD_LIFE);
  const h = s.snake[0], len = s.snake.length;
  s.gold.x = (h.x + 1) % L.N; s.gold.y = h.y; s.food = { x: (h.x + 9) % L.N, y: (h.y + 5) % L.N };
  const ev = L.step(s);
  assert.equal(ev.ate, "gold"); assert.equal(ev.pts, 50 * L.speedLevel(s)); assert.equal(s.gold, null);
  L.step(s); L.step(s);
  assert.equal(s.snake.length, len + 3, "1 ô đầu + 2 ô dài thêm");
  const t = L.newGame({ seed: 8, mode: "wrap" }); place(t, 0, 0); t.gold = { x: 19, y: 0, life: 2 };
  assert.equal(L.step(t).goldGone, false); assert.equal(L.step(t).goldGone, true); assert.equal(t.gold, null);
});

test("phủ kín bàn ⇒ thắng", () => {
  const s = L.newGame({ seed: 9, mode: "wrap" });
  const cells = []; for (let y = 0; y < L.N; y++) for (let x = 0; x < L.N; x++) cells.push({ x: y % 2 ? L.N - 1 - x : x, y });
  s.snake = cells.slice(0, L.N * L.N - 1).reverse(); // đầu ở ô áp chót, ô cuối là mồi
  const last = cells[L.N * L.N - 1], h = s.snake[0];
  s.dir = last.x > h.x ? "right" : last.x < h.x ? "left" : "down"; s.food = { ...last };
  L.step(s);
  assert.equal(s.status, "won"); assert.equal(s.food, null);
});
