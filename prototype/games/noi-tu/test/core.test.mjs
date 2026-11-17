// Unit test lõi Nối Từ: chuẩn hóa, từ điển, luật, AI.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeWord, NORM_VERSION } from '../core/normalize.js';
import { createDict } from '../core/dict.js';
import { reduce, validate, replay, pinOf } from '../core/rules.js';
import { pickWord } from '../core/ai.js';
import { createRng } from '../core/rng.js';
import { TEST_WORDS } from './fixtures.mjs';

test('chuẩn hóa: hòa/hoà, khỏe/khoẻ, thúy/thuý ra cùng khóa (kiểu cũ); hoa thường, khoảng trắng, NFD', () => {
  const same = [['hoà bình', 'hòa bình'], ['khoẻ mạnh', 'khỏe mạnh'], ['thuý', 'thúy'], ['HOÀ   Bình ', 'hòa bình'],
    ['hoà bình'.normalize('NFD'), 'hòa bình'], ['Hòa-bình!', 'hòa bình'], ['loè loẹt', 'lòe loẹt']];
  for (const [a, b] of same) assert.equal(normalizeWord(a), b, a);
  // có phụ âm cuối hoặc nguyên âm có mũ/móc: hai kiểu giống nhau, không bị đổi
  for (const w of ['hoàng hôn', 'thuyền buồm', 'quý giá', 'giữa trưa', 'người ta', 'ngoài trời', 'khuỷu tay', 'tươi cười', 'gìn giữ'])
    assert.equal(normalizeWord(w), w, w);
  assert.equal(NORM_VERSION, 1);
});

test('từ điển: hash không phụ thuộc thứ tự/kiểu dấu; đổi nội dung ⇒ đổi hash', () => {
  const a = createDict({ words: ['hòa bình', 'bình minh'] });
  const b = createDict({ words: ['bình minh', 'hoà bình', 'hoà bình'] });
  const c = createDict({ words: ['hòa bình', 'bình minh', 'minh họa'] });
  assert.equal(a.contentHash, b.contentHash);
  assert.notEqual(a.contentHash, c.contentHash);
  assert.equal(a.size, 2);
  assert.ok(a.has('hòa bình'));
  assert.equal(c.countNext('minh', new Set()), 1);
  assert.equal(c.countNext('minh', new Set(['minh họa'])), 0);
});

function startState(dict, config = {}) {
  let s = reduce(null, { seq: 1, type: 'matchCreated', matchId: 'x', pin: pinOf(dict), config,
    seats: [{ kind: 'human', id: 'a', name: 'A' }, { kind: 'bot', id: 'b', name: 'B' }] });
  s = reduce(s, { seq: 2, type: 'roundStarted', roundId: 'r1', first: 0, at: 0, deadlineAt: 15000 });
  return s;
}

test('luật: nối âm tiết, lặp từ, sai lượt, 2 âm tiết, không có trong từ điển', () => {
  const d = createDict({ words: TEST_WORDS });
  let s = startState(d);
  assert.equal(validate(s, 1, 'học tập', d).reason, 'not-your-turn');
  assert.equal(validate(s, 0, 'học', d).reason, 'need-two-syllables');
  assert.equal(validate(s, 0, 'học tập vở', d).reason, 'need-two-syllables');
  assert.equal(validate(s, 0, 'xe đạp', d).reason, 'not-in-dict');
  assert.ok(validate(s, 0, 'Học Tập', d).ok);
  s = reduce(s, { seq: 3, type: 'played', roundId: 'r1', seat: 0, word: 'học tập', at: 10, deadlineAt: 15010 });
  assert.equal(validate(s, 1, 'vở viết', d).reason, 'wrong-link');
  s = reduce(s, { seq: 4, type: 'played', roundId: 'r1', seat: 1, word: 'tập thể', at: 20, deadlineAt: 15020 });
  s = reduce(s, { seq: 5, type: 'played', roundId: 'r1', seat: 0, word: 'thể thao', at: 30, deadlineAt: 15030 });
  assert.ok(validate(s, 1, 'thao tác', d).ok);
  assert.throws(() => reduce(s, { seq: 7, type: 'played', roundId: 'r1', seat: 1, word: 'thao tác', at: 1, deadlineAt: 2 }), /seq/);
});

test('luật: từ cụt tính sau khi trừ từ vừa dùng ("ba ba" tự nối chính nó)', () => {
  const d = createDict({ words: TEST_WORDS });
  let s = startState(d);
  s = reduce(s, { seq: 3, type: 'played', roundId: 'r1', seat: 0, word: 'số ba', at: 1, deadlineAt: 2 });
  const v = validate(s, 1, 'ba ba', d);
  assert.equal(v.ok, true); assert.equal(v.deadEnd, true); assert.equal(v.options, 0);
  const s2 = startState(d, { noDeadEnd: true });
  const s3 = reduce(s2, { seq: 3, type: 'played', roundId: 'r1', seat: 0, word: 'số ba', at: 1, deadlineAt: 2 });
  assert.equal(validate(s3, 1, 'ba ba', d).reason, 'dead-end');
});

test('replay: fold log = state, mọi sự kiện kể cả đổi ghế/cấu hình/chơi lại', () => {
  const d = createDict({ words: TEST_WORDS });
  const log = [
    { seq: 1, type: 'matchCreated', matchId: 'x', pin: pinOf(d), config: {}, seats: [{ kind: 'human', id: 'a', name: 'A' }, { kind: 'human', id: 'b', name: 'B' }] },
    { seq: 2, type: 'roundStarted', roundId: 'r1', first: 0, at: 0, deadlineAt: 15000 },
    { seq: 3, type: 'played', roundId: 'r1', seat: 0, word: 'học tập', at: 5, deadlineAt: 15005 },
    { seq: 4, type: 'seatChanged', seat: 1, kind: 'bot', id: 'bot-1', name: 'Máy' },
    { seq: 5, type: 'roundEnded', roundId: 'r1', winner: 0, reason: 'timeout', at: 15005 },
    { seq: 6, type: 'configChanged', config: { turnMs: 20000 } },
    { seq: 7, type: 'rematchRequested', seat: 0 }, { seq: 8, type: 'rematchRequested', seat: 1 },
    { seq: 9, type: 'roundStarted', roundId: 'r2', first: 1, at: 16000, deadlineAt: 36000 },
  ];
  const s = replay(log);
  assert.equal(s.seq, 9); assert.equal(s.score.join(), '1,0'); assert.equal(s.config.turnMs, 20000);
  assert.equal(s.seats[1].kind, 'bot'); assert.equal(s.round.turn, 1); assert.equal(s.roundNo, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s, 'state JSON được');
});

test('AI đấu AI 200 ván trên từ điển khởi đầu: luôn hợp lệ, kết thúc, đủ nhanh', () => {
  const src = JSON.parse(readFileSync(new URL('../data/words.json', import.meta.url), 'utf8'));
  const d = createDict(src);
  assert.equal(d.contentHash, src.contentHash, 'hash trong file khớp hash tính lại');
  const t0 = performance.now();
  let moves = 0, slowest = 0;
  for (let g = 0; g < 200; g++) {
    const rng = createRng(g + 1);
    let s = startState(d), seq = 2;
    s.seats[0].kind = 'bot';
    for (let i = 0; i < 400; i++) {
      const seat = s.round.turn, lvl = (g + seat) % 2 ? 'hard' : 'easy';
      const m0 = performance.now();
      const w = pickWord(s, d, lvl, rng);
      slowest = Math.max(slowest, performance.now() - m0);
      if (!w) { s = reduce(s, { seq: ++seq, type: 'roundEnded', roundId: 'r1', winner: 1 - seat, reason: 'resign', at: 0 }); break; }
      const v = validate(s, seat, w, d);
      assert.ok(v.ok, `${w}: ${v.reason}`);
      s = reduce(s, { seq: ++seq, type: 'played', roundId: 'r1', seat, word: v.key, at: 0, deadlineAt: 1 });
      moves++;
      if (v.deadEnd) { s = reduce(s, { seq: ++seq, type: 'roundEnded', roundId: 'r1', winner: seat, reason: 'no-move', at: 0 }); break; }
    }
    assert.ok(s.round.over, 'ván phải kết thúc');
  }
  const ms = performance.now() - t0;
  console.log(`  AI: ${moves} nước / 200 ván, ${ms.toFixed(0)} ms, nước chậm nhất ${slowest.toFixed(1)} ms`);
  assert.ok(slowest < 50, 'mỗi nước < 50 ms trên máy dev');
});
