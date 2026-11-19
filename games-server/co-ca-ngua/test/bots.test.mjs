// Bot Cờ Cá Ngựa online: chủ phòng thêm/bớt bot ở phòng chờ; máy chủ đi thay ghế bot. Chạy trực tiếp trên Room, đồng hồ giả.
// Chạy: node --test --test-concurrency=1 games-server/co-ca-ngua/test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as L from '../../../prototype/games/co-ca-ngua/logic.js';
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
function rng(seed) { let a = seed >>> 0 || 1; return (n) => { a = (a * 1103515245 + 12345) >>> 0; return (a >>> 16) % n; }; } // bit cao: bit thấp của LCG lặp chu kỳ ngắn
const room = (seed = 1) => { const clock = fakeClock(); return { r: new Room({ code: 'TEST1', L, clock, randInt: rng(seed) }), clock }; };

test('chủ phòng thêm / bớt bot; khách không thêm được; ghế bot không nhận lệnh', () => {
  const { r } = room();
  r.join('Chủ', 'a'.repeat(32)); r.join('Khách', 'b'.repeat(32));
  assert.equal(r.handle(1, { t: 'add-bot' }).err, 'not-host');
  assert.ok(r.handle(0, { t: 'add-bot' }).ok); assert.ok(r.handle(0, { t: 'add-bot' }).ok);
  assert.equal(r.handle(0, { t: 'add-bot' }).err, 'full');
  assert.deepEqual(r.viewFor(0).players.map((p) => p.bot), [false, false, true, true]);
  assert.equal(r.handle(2, { t: 'roll' }).err, 'no-seat');
  assert.equal(r.handle(0, { t: 'kick-bot', seat: 1 }).err, 'target');
  assert.ok(r.handle(0, { t: 'kick-bot', seat: 3 }).ok); assert.equal(r.players.length, 3);
});

test('chỉ còn bot ⇒ đóng phòng', () => {
  const { r } = room();
  r.join('Chủ', 'a'.repeat(32)); r.handle(0, { t: 'add-bot' });
  r.leave(0); assert.ok(r.closed);
});

test('1 người + 3 bot: bot tự đi sau ~1,8 s; người im lặng thì máy chủ đi thay ⇒ ván kết thúc', () => {
  for (let seed = 1; seed <= 5; seed++) {
    const { r, clock } = room(seed);
    r.join('Người', 'a'.repeat(32)); for (let k = 0; k < 3; k++) r.handle(0, { t: 'add-bot' });
    assert.ok(r.handle(0, { t: 'start' }).ok);
    let steps = 0, botActs = 0;
    while (r.phase === 'play' && steps < 50000) {
      const who = r.players[r.g.turn], t0 = clock.now();
      if (!clock.step()) break; steps++;
      if (who.bot) { botActs++; assert.ok(clock.now() - t0 <= 1800, 'bot không để quá 1,8 s'); }
    }
    assert.equal(r.phase, 'over', `seed ${seed}: ván phải kết thúc`);
    assert.ok(botActs > 20);
  }
});
