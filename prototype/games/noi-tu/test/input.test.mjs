// Gõ khi chưa bật bộ gõ tiếng Việt (lỗi chủ dự án gặp: "từ nào cũng báo không có trong từ điển").
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDict } from '../core/dict.js';
import { guessWord, telexSyllable, vniSyllable, stripMarks } from '../core/input.js';

const dict = createDict(JSON.parse(readFileSync(new URL('../data/words.json', import.meta.url), 'utf8')));

test('Telex thô từng âm tiết', () => {
  const cases = { hocj: 'học', taapj: 'tập', truwowngf: 'trường', ddaats: 'đất', nuwowcs: 'nước', hoaf: 'hòa', binhf: 'bình', khoer: 'khỏe', vieejt: 'việt', mawtj: 'mặt' };
  for (const [k, v] of Object.entries(cases)) assert.equal(telexSyllable(k), v, k);
  assert.equal(telexSyllable('sinh'), null); // s đầu là phụ âm, không phải dấu
  assert.equal(telexSyllable('tranh'), null);
});

test('VNI thô từng âm tiết', () => {
  const cases = { ho5c: 'học', ta6p5: 'tập', tru7o72ng: 'trường', d9a6t1: 'đất', hoa2: 'hòa', ma8t5: 'mặt' };
  for (const [k, v] of Object.entries(cases)) assert.equal(vniSyllable(k), v, k);
});

test('guessWord: có dấu đúng ⇒ giữ nguyên (exact)', () => {
  assert.deepEqual(guessWord('Học   Tập', dict), { word: 'học tập', via: 'exact' });
  assert.deepEqual(guessWord('hoà bình', dict), { word: 'hòa bình', via: 'exact' });
});

test('guessWord: Telex / VNI / không dấu ⇒ ra đúng từ trong từ điển', () => {
  assert.deepEqual(guessWord('hocj taapj', dict), { word: 'học tập', via: 'telex' });
  assert.deepEqual(guessWord('truwowngf hocj', dict), { word: 'trường học', via: 'telex' });
  assert.deepEqual(guessWord('ho5c ta6p5', dict), { word: 'học tập', via: 'vni' });
  assert.deepEqual(guessWord('hoc tap', dict), { word: 'học tập', via: 'plain' });
  assert.deepEqual(guessWord('hoc sinh', dict), { word: 'học sinh', via: 'plain' });
  assert.deepEqual(guessWord('gia dinh', dict), { word: 'gia đình', via: 'plain' });
});

test('guessWord: gõ tắt một tiếng (kể cả Telex / không dấu) khi đã có tiếng nối', () => {
  assert.deepEqual(guessWord('taapj', dict, 'học'), { word: 'học tập', via: 'telex' });
  assert.deepEqual(guessWord('tap', dict, 'học'), { word: 'học tập', via: 'plain' });
  assert.deepEqual(guessWord('tập', dict, 'học'), { word: 'học tập', via: 'exact' });
});

test('guessWord: không bịa từ — từ lạ / sai tiếng nối / mơ hồ ⇒ gửi nguyên chữ để trọng tài báo đúng lý do', () => {
  assert.equal(guessWord('xyz abc', dict).via, 'none');
  assert.equal(guessWord('hoc tap', dict, 'sinh').via, 'none');        // không bắt đầu bằng "sinh"
  assert.equal(guessWord('học hỏi', dict).via, 'none');                 // có dấu mà không có trong từ điển: tôn trọng nguyên văn
  const amb = dict.all().map(stripMarks).find((p, i, a) => a.indexOf(p) !== i); // một dạng không dấu ứng với ≥ 2 từ
  if (amb) { const g = guessWord(amb, dict); assert.equal(g.via, 'none'); assert.ok(g.candidates.length >= 2); }
});
