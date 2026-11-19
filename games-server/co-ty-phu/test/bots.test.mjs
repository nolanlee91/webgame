// Bot Cờ Tỷ Phú online: chủ phòng thêm/bớt bot ở phòng chờ; máy chủ chơi thay ghế bot. Chạy trực tiếp trên Room, đồng hồ giả.
// Chạy: node --test --test-concurrency=1 games-server/co-ty-phu/test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as L from '../../../prototype/games/co-ty-phu/logic.js';
const require = createRequire(import.meta.url);
const { Room } = require('../room.js');

function fakeClock() {
  let t = 0, q = [];
  return {
    now: () => t,
    setTimeout: (f, ms) => { const h = { f, at: t + ms }; q.push(h); return h; },
    clearTimeout: (h) => { q = q.filter((x) => x !== h); },
    step() { q.sort((a, b) => a.at - b.at); const h = q.shift(); if (!h) return false; t = h.at; h.f(); return true; },
  };
}
function rng(seed) { let a = seed >>> 0 || 1; return (n) => { a = (a * 1103515245 + 12345) >>> 0; return a % n; }; }
const room = (seed = 1) => { const clock = fakeClock(); return { r: new Room({ code: 'TEST1', L, clock, randInt: rng(seed), timings: { anim: 0 } }), clock }; };

test('chủ phòng thêm / bớt bot; khách không thêm được; ghế bot không nhận lệnh', () => {
  const { r } = room();
  r.join('Chủ', 'a'.repeat(32)); r.join('Khách', 'b'.repeat(32));
  assert.equal(r.handle(1, { t: 'add-bot' }).err, 'not-host');
  assert.ok(r.handle(0, { t: 'add-bot' }).ok); assert.ok(r.handle(0, { t: 'add-bot' }).ok);
  assert.equal(r.handle(0, { t: 'add-bot' }).err, 'full');
  assert.deepEqual(r.viewFor(0).players.map((p) => p.bot), [false, false, true, true]);
  assert.equal(new Set(r.players.map((p) => p.tok)).size, 4, 'mỗi ghế một linh vật');
  assert.equal(r.handle(2, { t: 'roll' }).err, 'no-seat');
  assert.equal(r.handle(0, { t: 'kick-bot', seat: 1 }).err, 'target', 'không bớt được người thật');
  assert.ok(r.handle(0, { t: 'kick-bot', seat: 3 }).ok); assert.equal(r.players.length, 3);
});

test('1 người + 1 bot bắt đầu được; người rời phòng chờ ⇒ chỉ còn bot ⇒ đóng phòng', () => {
  const { r } = room();
  r.join('Chủ', 'a'.repeat(32)); r.handle(0, { t: 'add-bot' });
  assert.equal(r.hostSeat, 0);
  r.leave(0);
  assert.ok(r.closed);
});

test('1 người + 3 bot: bot tự đi; người im lặng thì máy chủ cũng đi thay ⇒ ván kết thúc', () => {
  for (let seed = 1; seed <= 5; seed++) {
    const { r, clock } = room(seed);
    r.join('Người', 'a'.repeat(32)); for (let k = 0; k < 3; k++) r.handle(0, { t: 'add-bot' });
    assert.ok(r.handle(0, { t: 'start' }).ok);
    let steps = 0, botTurns = 0;
    while (r.phase === 'play' && steps < 20000) {
      const who = r.players[r.g.turn];
      if (who.bot) { botTurns++; assert.ok(r.deadline - clock.now() <= 1000, 'bot đi nhanh (≤ 1 s), không chờ hết 25 s'); }
      if (!clock.step()) break; steps++;
    }
    assert.equal(r.phase, 'over', `seed ${seed}: ván phải kết thúc`);
    assert.ok(botTurns > 10);
  }
});

test('về phòng chờ: giữ bot, chủ phòng vẫn là người thật', () => {
  const { r, clock } = room(2);
  r.join('Người', 'a'.repeat(32)); r.handle(0, { t: 'add-bot' });
  r.handle(0, { t: 'start' });
  while (r.phase === 'play' && clock.step());
  assert.ok(r.handle(0, { t: 'lobby' }).ok);
  assert.equal(r.players.length, 2); assert.equal(r.players[r.hostSeat].bot, undefined);
});
