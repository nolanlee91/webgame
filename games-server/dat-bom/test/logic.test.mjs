// Test luật Đặt Bom (prototype/games/dat-bom/logic.js) — không cần máy chủ.
// Chạy: node --test --test-concurrency=1 games-server/dat-bom/test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../../../prototype/games/dat-bom/logic.js';

const none = () => 0.99;                    // không gạch, không rơi vật phẩm
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };
const empty = () => L.makeGrid(none);
function game(n = 2, rand = none, rules) {
  const g = L.createGame({ players: n, rand, now: 0, rules: { countdown: 0, ...rules } });
  return g;
}
const blk = (g, me = 0) => L.blocker(g.grid, g.bombs, me);

test('bản đồ: viền + cột cố định, góc xuất phát luôn trống', () => {
  for (let k = 0; k < 30; k++) {
    const grid = L.makeGrid(Math.random);
    assert.equal(grid.length, L.W * L.H);
    for (let x = 0; x < L.W; x++) { assert.equal(L.cell(grid, x, 0), '#'); assert.equal(L.cell(grid, x, L.H - 1), '#'); }
    assert.equal(L.cell(grid, 2, 2), '#'); assert.equal(L.cell(grid, 4, 6), '#');
    for (const [x, y] of L.SPAWNS) {
      assert.equal(L.cell(grid, x, y), '.');
      assert.equal(L.cell(grid, x + (x === 1 ? 1 : -1), y), '.');
      assert.equal(L.cell(grid, x, y + (y === 1 ? 1 : -1)), '.');
    }
  }
  const full = L.makeGrid(() => 0);
  assert.ok(full.filter((c) => c === '+').length > 60, 'rand thấp ⇒ nhiều gạch');
});

test('đi theo làn: dừng ở tâm ô trước tường, không đi xuyên cột', () => {
  const g = game();
  let p = { x: 1, y: 1 };
  p = L.move(p, 'l', 0.8, blk(g)); assert.deepEqual(p, { x: 1, y: 1 }, 'tường viền bên trái');
  p = L.move(p, 'r', 0.5, blk(g)); assert.deepEqual(p, { x: 1.5, y: 1 });
  p = L.move(p, 'd', 0.3, blk(g)); // lệch 0,5 khỏi làn dọc ⇒ đang ở giữa ô 1 và 2 (ô (2,2) là cột) ⇒ chỉ canh làn
  assert.equal(p.y, 1); assert.ok(p.x < 1.5);
  // đi hết hàng 1: không bao giờ vượt x = 11
  p = { x: 1, y: 1 }; for (let k = 0; k < 100; k++) p = L.move(p, 'r', 0.3, blk(g));
  assert.deepEqual(p, { x: 11, y: 1 });
  // đi xuống từ (2,1) bị cột (2,2) chặn
  assert.deepEqual(L.move({ x: 2, y: 1 }, 'd', 0.4, blk(g)), { x: 2, y: 1 });
});

test('hỗ trợ vào góc: lệch > 0,3 ô về phía làn trống thì tự trượt sang', () => {
  const g = game();
  // đứng ở (1.6, 1) muốn đi xuống: cột 2 bị cột (2,2) chặn, cột 1 trống ⇒ ... ô gần nhất là 2 (lệch -0,4 về phía cột 1)
  const p = L.move({ x: 1.6, y: 1 }, 'd', 0.2, blk(g));
  assert.ok(Math.abs(p.x - 1.4) < 1e-6 && p.y === 1, JSON.stringify(p));
});

test('vị trí hợp lệ: không chạm tường, phải thẳng hàng ít nhất một trục', () => {
  const g = game();
  assert.ok(L.fits(g.grid, g.bombs, 0, 1, 1));
  assert.ok(L.fits(g.grid, g.bombs, 0, 1.5, 1));
  assert.ok(!L.fits(g.grid, g.bombs, 0, 1.5, 1.5), 'chéo giữa hai làn');
  assert.ok(!L.fits(g.grid, g.bombs, 0, 2, 2), 'trong cột');
  assert.ok(!L.fits(g.grid, g.bombs, 0, 2, 1.3), 'đè lên cột (2,2)');
  assert.ok(!L.fits(g.grid, g.bombs, 0, 0.7, 1), 'đè lên tường viền');
});

test('kiểm tra di chuyển của máy chủ: chặn chạy quá tốc độ, dịch chuyển tức thời, xuyên tường', () => {
  const g = game();
  assert.ok(!L.tryMove(g, 0, 3, 1, 'r', 50), 'nhảy 2 ô trong 50 ms');
  assert.ok(L.tryMove(g, 0, 1.16, 1, 'r', 100), 'đi đúng tốc độ (3,2 ô/s × 0,05 s)');
  // giả gói 20 lần/giây, mỗi gói đi gấp đôi tốc độ ⇒ phải bị chặn trong vòng 1 giây
  let t = 100, x = 1.16, rejected = false;
  for (let k = 0; k < 20; k++) { t += 50; const nx = Math.min(11, x + 0.32); if (!L.tryMove(g, 0, nx, 1, 'r', t)) { rejected = true; break; } x = nx; }
  assert.ok(rejected, 'chạy x2 tốc độ phải bị phát hiện');
  // tốc độ thật (có rung mạng ±20 ms) thì không bị chặn
  const h = game(); t = 0; x = 1;
  for (let k = 0; k < 40; k++) { const dt = 50 + (k % 2 ? 20 : -20); t += dt; const nx = Math.min(11, x + 3.2 * dt / 1000); assert.ok(L.tryMove(h, 0, nx, 1, 'r', t), `bước ${k}`); x = nx; }
  // không xuyên cột
  const c = game(); c.players[0].x = 2; c.players[0].y = 1;
  assert.ok(!L.tryMove(c, 0, 2, 1.15, 'd', 1000));
});

test('bom: nổ sau 2,5 s, lửa theo tầm, phá gạch rồi dừng, cộng điểm', () => {
  const g = game(2, none);
  g.grid[L.idx(3, 1)] = '+'; g.grid[L.idx(1, 2)] = '+';
  g.players[0].x = 1; g.players[0].y = 1;
  assert.ok(L.placeBomb(g, 0, 0));
  assert.ok(!L.placeBomb(g, 0, 10), 'chỉ có 1 quả lúc đầu');
  // tự né: về (2,1)? (2,1) vẫn trong tầm 2. Cho người 0 đứng xa bằng cách đặt thẳng toạ độ
  g.players[0].x = 1; g.players[0].y = 5;
  L.tick(g, 2499, none); assert.equal(g.bombs.length, 1);
  L.tick(g, 2500, none);
  assert.equal(g.bombs.length, 0);
  assert.equal(L.cell(g.grid, 3, 1), '.'); assert.equal(L.cell(g.grid, 1, 2), '.');
  assert.ok(g.flames.has(L.idx(2, 1)) && g.flames.has(L.idx(3, 1)));
  assert.ok(!g.flames.has(L.idx(1, 3)), 'gạch chặn lửa');
  assert.equal(g.players[0].bricks, 2); assert.equal(g.players[0].score, 20);
  L.tick(g, 3000, none); assert.equal(g.flames.size, 0, 'lửa tắt sau 0,5 s');
});

test('nổ dây chuyền + hạ người khác được 100 điểm, người cuối cùng thắng', () => {
  const g = game(2, none);
  g.players[0].bombs = 2;
  g.players[0].x = 1; g.players[0].y = 1; L.placeBomb(g, 0, 0);
  g.players[0].x = 3; g.players[0].y = 1; L.placeBomb(g, 0, 1000); // quả 2 trong tầm quả 1
  g.players[0].x = 1; g.players[0].y = 7;
  g.players[1].x = 5; g.players[1].y = 1; // chỉ quả 2 (tầm 2 từ x=3) mới với tới
  L.tick(g, 2500, none);
  assert.equal(g.bombs.length, 0, 'quả 2 nổ theo');
  assert.equal(g.players[1].alive, false);
  assert.equal(g.players[0].kills, 1); assert.equal(g.players[0].score, 100);
  assert.ok(g.over); assert.equal(g.winner, 0); assert.equal(g.reason, 'last');
});

test('tự nổ không được điểm; cả hai cùng chết ⇒ hoà', () => {
  const g = game(2, none);
  g.players[1].x = 2; g.players[1].y = 1;
  L.placeBomb(g, 0, 0);
  L.tick(g, 2500, none);
  assert.ok(g.over); assert.ok(g.draw); assert.equal(g.winner, -1);
  assert.equal(g.players[0].score, 100, 'hạ người 1 được 100, tự nổ chết không cộng/trừ gì');
  assert.equal(g.players[0].kills, 1, 'hạ người 1 vẫn tính');
});

test('bom đặt dưới chân đi xuyên được tới khi bước ra, sau đó chặn', () => {
  const g = game(2, none);
  L.placeBomb(g, 0, 0);
  assert.ok(!blk(g, 0)(1, 1), 'vẫn đứng trên bom');
  assert.ok(blk(g, 1)(1, 1), 'người khác bị chặn');
  g.players[0].x = 2; L.tick(g, 100, none);
  assert.ok(blk(g, 0)(1, 1), 'đã bước ra thì bị chặn');
  assert.ok(!L.fits(g.grid, g.bombs, 0, 1.4, 1));
});

test('vật phẩm rơi sau khi lửa tắt, nhặt được, tăng chỉ số, có giới hạn', () => {
  const g = game(2, seq(0.99));
  g.grid[L.idx(3, 1)] = '+';
  g.players[0].x = 5; g.players[0].y = 5; // đứng ngoài tầm
  g.players[1].x = 11; g.players[1].y = 9;
  g.bombs.push({ id: 9, x: 3, y: 2, owner: 0, range: 1, at: 0, pass: [] }); // (3,2) không phải cột
  // rand: 0.1 ⇒ rơi; 0.5 ⇒ loại thứ 2 ("f")
  const r = seq(0.1, 0.5);
  L.tick(g, 10, r);
  assert.equal(g.items.size, 0, 'chưa hiện khi lửa còn cháy');
  g.players[0].x = 1; g.players[0].y = 5;
  L.tick(g, 600, none);
  assert.equal(g.items.get(L.idx(3, 1)), 'f');
  g.players[0].x = 3; g.players[0].y = 1; L.tick(g, 650, none);
  assert.equal(g.players[0].range, 3); assert.equal(g.items.size, 0); assert.equal(g.players[0].score, 10 + 5);
  // giới hạn
  for (let k = 0; k < 20; k++) { g.items.set(L.idx(3, 1), 's'); L.tick(g, 700 + k, none); }
  assert.equal(g.players[0].speed, L.RULES.maxSpeed);
});

test('lửa đốt cháy vật phẩm đang nằm trên đường', () => {
  const g = game(2, none);
  g.items.set(L.idx(3, 1), 'b');
  g.bombs.push({ id: 1, x: 5, y: 1, owner: 1, range: 2, at: 0, pass: [] });
  g.players[1].x = 11; g.players[1].y = 9;
  L.tick(g, 1, none);
  assert.ok(!g.items.has(L.idx(3, 1)));
});

test('hết giờ: người còn sống điểm cao nhất thắng; bằng điểm thì hoà', () => {
  const g = game(3, none, { roundMs: 1000 });
  g.players[0].score = 50; g.players[1].score = 80; g.players[2].score = 200; g.players[2].alive = false;
  L.tick(g, 999, none); assert.ok(!g.over);
  L.tick(g, 1000, none); assert.ok(g.over); assert.equal(g.reason, 'time'); assert.equal(g.winner, 1);
  const h = game(2, none, { roundMs: 10 });
  L.tick(h, 10, none); assert.ok(h.over && h.draw);
});

test('đếm ngược: chưa được đi / đặt bom trước giờ bắt đầu', () => {
  const g = L.createGame({ players: 2, rand: none, now: 0 });
  assert.equal(g.startAt, 3000);
  assert.ok(!L.placeBomb(g, 0, 100));
  assert.ok(!L.tryMove(g, 0, 1.1, 1, 'r', 100));
  assert.ok(L.placeBomb(g, 0, 3000));
});
