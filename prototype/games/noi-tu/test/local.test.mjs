// LocalSession (offline, chơi với bot) — đúng đường code mà UI bước 2 sẽ dùng.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalSession } from '../session/local.js';
import { fakeScheduler } from '../session/scheduler.js';
import { createDict } from '../core/dict.js';
import { lastSyl } from '../core/normalize.js';
import { TEST_WORDS } from './fixtures.mjs';

const tick = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r)); };
const memStore = () => { const m = new Map(); return { get: (k) => m.get(k) ?? null, set: (k, v) => m.set(k, v), remove: (k) => m.delete(k), m }; };

test('LocalSession: chơi với bot, bot đáp đúng luật, đóng tab mở lại tiếp tục ván với giờ lượt mới', async () => {
  const dict = createDict({ words: TEST_WORDS });
  const sch = fakeScheduler(0), storage = memStore();
  const opts = { dict, mode: 'bot', scheduler: sch, storage, seed: 3, config: { turnMs: 15000 } };
  const s = createLocalSession(opts);
  await tick();
  assert.equal(s.mySeat, 0); assert.equal(s.status, 'live');
  assert.equal((await s.submit('học tập')).ok, true);
  await tick();
  sch.advance(2600); await tick();                 // bot suy nghĩ 0,8–2,5 s
  const chain = s.state.round.chain;
  assert.equal(chain.length, 2);
  assert.equal(chain[1].word.split(' ')[0], 'tập');
  const myTurnSeq = s.seq;
  sch.advance(10000); await tick();                // đang lượt mình, còn 5 s thì đóng tab
  s.dispose();

  const s2 = createLocalSession(opts);             // mở lại: dựng từ log đã lưu
  await tick();
  assert.equal(s2.state.round.chain.length, 2);
  assert.equal(s2.state.round.turn, 0);
  assert.ok(s2.seq > myTurnSeq, 'có sự kiện clockReset');
  assert.equal(s2.remainingMs(), 15000, 'lượt được tính giờ lại, không xử thua vì lúc đóng tab');
  const w = TEST_WORDS.find((x) => x.startsWith(lastSyl(chain[1].word) + ' ') && !chain.some((c) => c.word === x));
  if (w) assert.equal((await s2.submit(w)).ok, true);
  await s2.resign(); await tick();
  assert.equal(s2.state.round.over, true);
  assert.equal((await s2.rematch()).ok, true); await tick();
  assert.equal(s2.state.round.no, 2, 'bot luôn đồng ý chơi lại');
  assert.equal(s2.state.round.turn, 0, 'người thua (mình) đi trước');
  s2.dispose();
});

test('LocalSession: từ điển đổi (hash khác) ⇒ không khôi phục ván cũ, mở ván mới', async () => {
  const sch = fakeScheduler(0), storage = memStore();
  const a = createLocalSession({ dict: createDict({ words: TEST_WORDS }), mode: 'bot', scheduler: sch, storage, seed: 1 });
  await tick(); await a.submit('học tập'); await tick(); a.dispose();
  const b = createLocalSession({ dict: createDict({ words: [...TEST_WORDS, 'xe đạp'] }), mode: 'bot', scheduler: sch, storage, seed: 1 });
  await tick();
  assert.equal(b.state.round.chain.length, 0);
  b.dispose();
});

test('LocalSession hai người chung máy: mỗi ghế một client, cùng một trọng tài', async () => {
  const sch = fakeScheduler(0);
  const s = createLocalSession({ dict: createDict({ words: TEST_WORDS }), mode: 'hotseat', scheduler: sch, names: ['An', 'Bình'] });
  await tick();
  const [p0, p1] = s.seatsClients;
  assert.equal(p0.mySeat, 0); assert.equal(p1.mySeat, 1);
  assert.equal((await p0.submit('học tập')).ok, true); await tick();
  assert.equal((await p1.submit('tập vở')).ok, true); await tick();
  assert.deepEqual(p0.state, p1.state);
  p0.dispose(); p1.dispose();
});
