// Test hồi quy cho 4 lỗi Codex tìm ra khi review commit 86d69b4 (mỗi lỗi một nhóm test, tái hiện đúng tình huống gốc).
import test from 'node:test';
import assert from 'node:assert/strict';
import { RefereeHost } from '../session/referee.js';
import { createLocalSession } from '../session/local.js';
import { fakeScheduler } from '../session/scheduler.js';
import { createDict } from '../core/dict.js';
import { pinOf, replay } from '../core/rules.js';
import { setup, TEST_PIN } from './harness.mjs';
import { TEST_WORDS, SEATS, MATCH } from './fixtures.mjs';

const dict = createDict({ words: TEST_WORDS });
const tick = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r)); };

/** Scheduler "event loop nghẽn": không tự chạy gì, test tự chọn chạy callback nào, vào lúc nào. */
function stalledScheduler() {
  let now = 0, id = 0;
  const tasks = new Map();
  return {
    now: () => now, set: (t) => { now = t; },
    at: (at, fn) => { tasks.set(++id, { at, fn }); return id; },
    cancel: (i) => tasks.delete(i),
    run: (i) => { const t = tasks.get(i); tasks.delete(i); t.fn(); },
  };
}
const botFirst = () => [{ kind: 'bot', id: 'bot', name: 'Máy' }, SEATS[1]];

// ---------- Lỗi 1: bot đánh quá giờ khi callback chạy trễ ----------
test('lỗi 1: callback bot chạy trễ quá deadline (event loop nghẽn) ⇒ bot KHÔNG được đánh, xử thua hết giờ', () => {
  const sch = stalledScheduler();
  const host = new RefereeHost({ matchId: 'lag', dict, scheduler: sch, seats: botFirst(), config: { turnMs: 15000 }, botDelay: [800, 1000], seed: 3 });
  const deadline = host.state.round.deadlineAt;
  assert.equal(deadline, 15000);
  sch.set(20000);                         // callback bot lẽ ra chạy ở ~0,9 s nhưng tới giây 20 mới chạy
  sch.run(host.timers.bot);
  const r = host.state.round;
  assert.equal(r.over, true, 'ván phải kết thúc');
  assert.equal(r.chain.length, 0, 'bot không được đặt từ nào sau deadline');
  assert.ok(!host.log.some((e) => e.type === 'played'));
  const end = host.log.at(-1).type === 'roundEnded' ? host.log.at(-1) : host.log.find((e) => e.type === 'roundEnded');
  assert.equal(end.reason, 'timeout');
  assert.equal(end.winner, 1);
  assert.equal(end.at, deadline, 'thua tính tại deadline, không bị đẩy deadline lên 35 s');
  assert.deepEqual(replay(host.log), host.state);
});

test('lỗi 1 (đối chứng): callback bot chạy đúng giờ ⇒ vẫn đánh bình thường, deadline mới tính từ lúc đánh', () => {
  const sch = stalledScheduler();
  const host = new RefereeHost({ matchId: 'ok', dict, scheduler: sch, seats: botFirst(), config: { turnMs: 15000 }, botDelay: [800, 1000], seed: 3 });
  sch.set(14999);                         // trễ nhưng vẫn trước deadline 1 ms
  sch.run(host.timers.bot);
  const r = host.state.round;
  assert.equal(r.over, false);
  assert.equal(r.chain.length, 1);
  assert.equal(r.deadlineAt, 14999 + 15000);
});

// ---------- Lỗi 2: client kẹt state cũ khi nhận 'stale' ----------
for (const backend of ['process', 'inproc']) {
  test(`lỗi 2 [${backend}]: lỡ sự kiện, submit bị 'stale' ⇒ client tự xin snapshot NGAY, không chờ sự kiện kế tiếp`, async () => {
    const h = await setup(backend, { matchId: MATCH, seats: SEATS, config: { turnMs: 15000 }, seed: 7 });
    const a = h.client('tok-an'), b = h.client('tok-binh');
    await h.flush();
    b.tr.fault({ dir: 'down', match: (m) => m.t === 'event' && m.ev.type === 'played', action: 'drop' });
    await a.submit('học tập'); await h.flush();
    assert.equal(b.seq, 2, 'B lỡ sự kiện seq 3');
    const res = await b.submit('tập vở');
    assert.equal(res.reason, 'stale');
    assert.equal(res.seq, 3);
    await h.flush();                       // KHÔNG chạy thời gian: không có sự kiện mới nào được phát
    const { state } = await h.dump();
    assert.ok(b.tr.sent.includes('sync'), 'phải xin snapshot');
    assert.equal(b.seq, state.seq, 'client bắt kịp seq server');
    assert.deepEqual(b.state, state);
    assert.ok(!b.fx.includes(3), 'không chạy hiệu ứng của sự kiện đã lỡ');
    assert.equal((await b.submit('tập vở')).ok, true, 'gửi lại theo state mới thì được nhận');
    await h.close();
  });

  test(`lỗi 2 [${backend}]: yêu cầu snapshot bị rơi ⇒ client gửi lại cho tới khi bắt kịp`, async () => {
    const h = await setup(backend, { matchId: MATCH, seats: SEATS, config: { turnMs: 15000 }, seed: 7 });
    const a = h.client('tok-an'), b = h.client('tok-binh');
    await h.flush();
    b.tr.fault({ dir: 'down', match: (m) => m.t === 'event' && m.ev.type === 'played', action: 'drop' });
    b.tr.fault({ dir: 'up', match: (m) => m.t === 'sync', action: 'drop' });
    await a.submit('học tập'); await h.flush();
    assert.equal((await b.submit('tập vở')).reason, 'stale');
    await h.flush();
    assert.equal(b.seq, 2, 'sync đầu bị rơi');
    await h.advance(1000);                 // hết retryMs ⇒ gửi lại sync
    assert.equal(b.seq, 3);
    await h.close();
  });
}

// ---------- Lỗi 3: dispose LocalSession nhưng trọng tài vẫn chạy ngầm ----------
test('lỗi 3: dispose LocalSession (chơi với bot) ⇒ không còn hẹn giờ nào, trọng tài không tự đổi ghế/mở ván', async () => {
  const sch = fakeScheduler(0);
  const s = createLocalSession({ dict, mode: 'bot', scheduler: sch, seed: 1 });
  await tick();
  assert.equal(s.status, 'live');
  const logLen = s.host.log.length;
  s.dispose();
  await tick();
  assert.equal(sch.pending(), 0, 'mọi hẹn giờ (lượt, bot, chờ kết nối lại, ping) đã hủy');
  sch.advance(31000); sch.advance(120000); await tick();
  assert.equal(s.host.log.length, logLen, 'không phát sinh sự kiện nào sau khi rời game');
  assert.ok(!s.host.log.some((e) => e.type === 'seatChanged'));
  assert.equal(s.host.state.roundNo, 1, 'không mở ván mới');
});

test('lỗi 3: hotseat — dispose một client ⇒ đóng cả hai ghế và trọng tài', async () => {
  const sch = fakeScheduler(0);
  const s = createLocalSession({ dict, mode: 'hotseat', scheduler: sch, names: ['An', 'Bình'] });
  await tick();
  const [p0, p1] = s.seatsClients;
  await p0.submit('học tập'); await tick();
  const logLen = s.host.log.length;
  p1.dispose();
  await tick();
  assert.equal(p0.status, 'closed'); assert.equal(p1.status, 'closed');
  assert.equal(sch.pending(), 0);
  sch.advance(200000); await tick();
  assert.equal(s.host.log.length, logLen);
  p0.dispose();                            // gọi lại không lỗi
});

// ---------- Lỗi 4: join thiếu pin vẫn được vào ----------
test('lỗi 4: trọng tài — join thiếu pin / pin sai / pin thiếu trường ⇒ bị từ chối, pin đúng ⇒ welcome', () => {
  const host = new RefereeHost({ matchId: 'auth', dict, scheduler: fakeScheduler(0), seats: SEATS });
  const join = (connId, extra) => {
    const out = [];
    host.connect(connId, (m) => out.push(m));
    host.message(connId, { t: 'join', token: 'tok-an', matchId: 'auth', ...extra });
    return out;
  };
  const none = join('c1', {});
  assert.deepEqual(none.map((m) => m.t), ['joinRejected']);
  assert.equal(none[0].reason, 'pin-required');
  assert.deepEqual(none[0].pin, pinOf(dict), 'trả pin đúng để client biết cần tải bản nào');
  assert.equal(join('c2', { pin: { ...pinOf(dict), dictHash: 'khac' } })[0].reason, 'pin-mismatch');
  assert.equal(join('c3', { pin: { dictHash: pinOf(dict).dictHash } })[0].reason, 'pin-mismatch', 'thiếu phiên bản luật/chuẩn hóa');
  assert.equal(join('c4', { pin: { ...pinOf(dict), rulesVersion: 999 } })[0].reason, 'pin-mismatch');
  const ok = join('c5', { pin: pinOf(dict) });
  assert.equal(ok[0].t, 'welcome');
});

for (const backend of ['process', 'inproc']) {
  test(`lỗi 4 [${backend}]: client không gửi pin ⇒ đóng với lý do pin-required, không nhận state`, async () => {
    const h = await setup(backend, { matchId: MATCH, seats: SEATS, config: { turnMs: 15000 } });
    const c = h.client('tok-an', { pin: null });
    await h.flush();
    assert.equal(c.status, 'closed');
    assert.equal(c.rejectReason, 'pin-required');
    assert.equal(c.state, null);
    const ok = h.client('tok-an');           // mặc định gửi TEST_PIN
    await h.flush();
    assert.equal(ok.status, 'live');
    assert.deepEqual(ok.pin, TEST_PIN);
    await h.close();
  });
}

test('lỗi 4: LocalSession luôn gửi pin của từ điển đang dùng (cả hai ghế hotseat)', async () => {
  const sch = fakeScheduler(0);
  const s = createLocalSession({ dict, mode: 'hotseat', scheduler: sch });
  await tick();
  for (const c of s.seatsClients) { assert.deepEqual(c.pin, pinOf(dict)); assert.equal(c.status, 'live'); }
  s.dispose();
});

// ---------- Kèm theo (Codex ghi chú, không bắt buộc): message hỏng, sync trước join ----------
test('kèm theo: message null/chuỗi không làm sập trọng tài; sync khi chưa join bị từ chối', () => {
  const host = new RefereeHost({ matchId: 'x', dict, scheduler: fakeScheduler(0), seats: SEATS });
  const out = [];
  host.connect('c', (m) => out.push(m));
  assert.doesNotThrow(() => { host.message('c', null); host.message('c', 'rác'); host.message('c', 42); });
  host.message('c', { t: 'sync' });
  assert.deepEqual(out.map((m) => m.t), ['syncRejected'], 'không lộ state cho kết nối chưa vào phòng');
});
