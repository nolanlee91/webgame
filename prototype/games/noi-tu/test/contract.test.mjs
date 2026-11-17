// Bộ test hợp đồng MatchSession — chạy NGUYÊN BỘ cho cả hai backend:
//   process: trọng tài ở tiến trình Node riêng (hai phía độc lập, chỉ trao đổi JSON)
//   inproc : trọng tài cùng tiến trình (đường của LocalSession)
import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './harness.mjs';
import { replay } from '../core/rules.js';
import { MATCH, SEATS, SERVER_T0, CLIENT_T0 } from './fixtures.mjs';

const HOST = (extra = {}) => ({ matchId: MATCH, seats: SEATS, config: { turnMs: 15000 }, graceMs: 30000, botDelay: [500, 1000], seed: 7, ...extra });
const count = (log, type) => log.filter((e) => e.type === type).length;

async function start(backend, hostExtra) {
  const h = await setup(backend, HOST(hostExtra));
  const a = h.client('tok-an'), b = h.client('tok-binh');
  await h.flush();
  return { h, a, b };
}

/** Mỗi test kết thúc bằng kiểm tra chung: server tự nhất quán, client trùng khớp server, không hiệu ứng nào chạy 2 lần. */
async function invariants(h, ...clients) {
  await h.flush();
  const { log, state } = await h.dump();
  assert.deepEqual(replay(log), state, 'fold(log) phải đúng bằng state server');
  log.forEach((e, i) => assert.equal(e.seq, i + 1, 'seq liên tục, không hụt số'));
  assert.ok(!log.some((e) => e.type === 'rejected'), 'rejected không vào log');
  for (const c of clients) {
    if (c.status === 'closed') continue;
    assert.deepEqual(c.state, state, `client ghế ${c.mySeat} phải trùng state server`);
    assert.equal(new Set(c.fx).size, c.fx.length, 'không hiệu ứng nào chạy lại');
  }
  return { log, state };
}

for (const backend of ['process', 'inproc']) {
  test(`[${backend}] vào phòng: cả hai nhận snapshot, đúng ghế, lệch giờ được bù`, async () => {
    const { h, a, b } = await start(backend);
    assert.equal(a.mySeat, 0); assert.equal(b.mySeat, 1);
    assert.equal(a.status, 'live');
    assert.equal(a.state.round.turn, 0);
    assert.equal(a.offset, SERVER_T0 - CLIENT_T0);
    assert.equal(a.remainingMs(), 15000);
    await h.advance(4000);
    assert.equal(a.remainingMs(), 11000);
    await invariants(h, a, b); await h.close();
  });

  test(`[${backend}] từ hợp lệ áp cho cả hai; từ bị từ chối chỉ trả cho người gửi, đối thủ không thấy hụt seq`, async () => {
    const { h, a, b } = await start(backend);
    assert.deepEqual((await a.submit('Học  Tập')).ok, true);
    await h.flush();
    assert.deepEqual(b.state.round.chain.map((x) => x.word), ['học tập']);
    const seqB = b.seq, fxB = b.fx.length;
    const r1 = await b.submit('bình minh');
    assert.equal(r1.ok, false); assert.equal(r1.reason, 'wrong-link'); assert.equal(r1.need, 'tập');
    const r2 = await b.submit('tập tành');
    assert.equal(r2.reason, 'not-in-dict');
    const r3 = await a.submit('tập vở');
    assert.equal(r3.reason, 'not-your-turn');
    await h.flush();
    assert.equal(b.seq, seqB); assert.equal(a.seq, seqB); assert.equal(b.fx.length, fxB);
    assert.equal((await b.submit('tập vở')).ok, true);
    await h.flush();
    assert.equal((await a.submit('học tập')).reason, 'wrong-link');
    await invariants(h, a, b); await h.close();
  });

  test(`[${backend}] gửi trùng lệnh (gói nhân đôi) ⇒ chỉ đánh một lần`, async () => {
    const { h, a, b } = await start(backend);
    a.tr.fault({ dir: 'up', match: (m) => m.t === 'intent', action: 'dup' });
    const r = await a.submit('học tập');
    assert.equal(r.ok, true);
    await h.flush();
    const { log } = await invariants(h, a, b);
    assert.equal(count(log, 'played'), 1);
    await h.close();
  });

  test(`[${backend}] mất ACK ⇒ client gửi lại cùng commandId, server trả kết quả cũ, không đánh 2 lần`, async () => {
    const { h, a, b } = await start(backend);
    a.tr.fault({ dir: 'down', match: (m) => m.t === 'result', action: 'drop' });
    let res = null;
    a.submit('học tập').then((r) => { res = r; });
    await h.flush();
    assert.equal(res, null, 'chưa có kết quả vì ACK rơi');
    assert.equal(a.state.round.chain.length, 1, 'nhưng sự kiện played vẫn tới');
    await h.advance(1000); // hẹn giờ gửi lại
    assert.deepEqual(res, { ok: true, word: 'học tập', seq: 3 });
    const { log } = await invariants(h, a, b);
    assert.equal(count(log, 'played'), 1);
    await h.close();
  });

  test(`[${backend}] mất cả lệnh lẫn ACK nhiều lần ⇒ vẫn đúng một nước`, async () => {
    const { h, a, b } = await start(backend);
    a.tr.fault({ dir: 'up', match: (m) => m.t === 'intent', action: 'drop', times: 2 });
    a.tr.fault({ dir: 'down', match: (m) => m.t === 'result', action: 'drop', times: 2 });
    let res = null;
    a.submit('học tập').then((r) => { res = r; });
    for (let i = 0; i < 5 && !res; i++) await h.advance(1000);
    assert.equal(res.ok, true);
    const { log } = await invariants(h, a, b);
    assert.equal(count(log, 'played'), 1);
    await h.close();
  });

  test(`[${backend}] lệnh có expectedSeq cũ ⇒ 'stale', không đổi gì`, async () => {
    const { h, a, b } = await start(backend);
    const res = await a._command({ type: 'submit', word: 'học tập', expectedSeq: 1 });
    assert.equal(res.reason, 'stale');
    const { log } = await invariants(h, a, b);
    assert.equal(count(log, 'played'), 0);
    await h.close();
  });

  test(`[${backend}] sự kiện trùng ⇒ bỏ qua, hiệu ứng chạy đúng một lần`, async () => {
    const { h, a, b } = await start(backend);
    b.tr.fault({ dir: 'down', match: (m) => m.t === 'event', action: 'dup' });
    await a.submit('học tập');
    await h.flush();
    assert.equal(b.fx.filter((s) => s === 3).length, 1);
    assert.ok(!b.tr.sent.includes('sync'), 'sự kiện trùng không được coi là khoảng trống');
    await invariants(h, a, b); await h.close();
  });

  test(`[${backend}] sự kiện hụt ⇒ phát hiện khoảng trống, xin snapshot, không chạy lại hiệu ứng cũ`, async () => {
    const { h, a, b } = await start(backend);
    b.tr.fault({ dir: 'down', match: (m) => m.t === 'event' && m.ev.type === 'played', action: 'drop' });
    await a.submit('học tập');
    await h.flush();
    assert.equal(b.seq, 2, 'B chưa biết là đã hụt');
    await b.submit('tập vở').then((r) => assert.equal(r.reason, 'stale', 'B gửi theo state cũ bị từ chối'));
    await h.advance(15000); // hết giờ của B ⇒ roundEnded seq 4 tới B ⇒ thấy khoảng trống
    assert.equal(b.state.round.over, true);
    assert.ok(!b.fx.includes(3), 'không phát lại hiệu ứng của sự kiện đã lỡ');
    await invariants(h, a, b); await h.close();
  });

  test(`[${backend}] snapshot chồng lấn sự kiện đến muộn ⇒ sự kiện cũ bị bỏ, state không đổi`, async () => {
    const { h, a, b } = await start(backend);
    b.tr.fault({ dir: 'down', match: (m) => m.t === 'event', action: 'hold' });
    await a.submit('học tập');
    await h.flush();
    assert.equal(b.seq, 2);
    b.tr.cut(); await h.flush();
    b.tr.reconnect(); await h.flush();          // kết nối lại ⇒ snapshot seq 3
    assert.equal(b.seq, 3);
    assert.ok(b.tr.releaseHeld() >= 1);          // giờ mới thả sự kiện seq 3 đến muộn
    await h.flush();
    assert.equal(b.seq, 3);
    assert.ok(!b.fx.includes(3));
    assert.equal((await b.submit('tập vở')).ok, true);
    await invariants(h, a, b); await h.close();
  });

  test(`[${backend}] sự kiện đảo thứ tự ⇒ giữ chờ, áp đúng thứ tự`, async () => {
    const { h, a, b } = await start(backend);
    await a.submit('học tập'); await h.flush();
    await b.submit('tập vở'); await h.flush();
    await a.submit('vở viết'); await h.flush();
    b.tr.fault({ dir: 'down', match: (m) => m.t === 'event' && m.ev.type === 'played', action: 'hold' });
    await b.submit('viết thư'); await h.flush();         // seq 6 bị giữ lại phía B
    await a.submit('thư từ'); await h.flush();           // seq 7 tới B trước ⇒ B thấy khoảng trống
    b.tr.releaseHeld(); await h.flush();
    assert.equal(b.seq, 7);
    await invariants(h, a, b); await h.close();
  });

  test(`[${backend}] sát deadline: còn 1 ms vẫn nhận; đúng deadline thì không, xử thua vì hết giờ`, async () => {
    const { h, a, b } = await start(backend);
    await h.advance(14999);
    assert.equal((await a.submit('học tập')).ok, true);
    await h.flush();
    assert.equal(b.remainingMs(), 15000, 'lượt mới tính từ lúc server nhận');
    await h.advance(15000);
    const r = await b.submit('tập vở');
    assert.equal(r.ok, false);
    assert.ok(['late', 'stale', 'not-playing'].includes(r.reason), r.reason);
    assert.equal(b.state.round.over, true);
    assert.equal(b.state.round.reason, 'timeout');
    assert.equal(b.state.round.winner, 0);
    await invariants(h, a, b); await h.close();
  });

  test(`[${backend}] server không tin giờ client: lệnh tới sau deadline bị từ chối dù client gửi "đúng giờ"`, async () => {
    const { h, a, b } = await start(backend);
    a.tr.fault({ dir: 'up', match: (m) => m.t === 'intent', action: 'hold' });
    let res = null;
    a.submit('học tập').then((r) => { res = r; });
    await h.backend.advanceServer(15000); await h.flush(); // lệnh "kẹt mạng" quá deadline
    a.tr.releaseHeld(); await h.flush();
    assert.equal(res.ok, false);
    const { state } = await invariants(h, a, b);
    assert.equal(state.round.reason, 'timeout');
    await h.close();
  });

  test(`[${backend}] từ cụt: kiểm tra SAU khi trừ từ vừa dùng ⇒ thắng ngay (mặc định) / bị cấm (noDeadEnd)`, async () => {
    {
      const { h, a, b } = await start(backend);
      await a.submit('bàn ghế'); await h.flush();
      await b.submit('ghế gỗ'); await h.flush();
      assert.equal((await a.submit('gỗ lim')).ok, true);
      await h.flush();
      assert.equal(b.state.round.over, true);
      assert.equal(b.state.round.reason, 'no-move');
      assert.equal(b.state.round.winner, 0);
      await invariants(h, a, b); await h.close();
    }
    {
      // 'số ba' → chỉ còn 'ba ba'. Đánh 'ba ba' xong, đường nối duy nhất của 'ba' chính là từ vừa dùng ⇒ cụt.
      const { h, a, b } = await start(backend);
      const r1 = await a.submit('số ba');
      assert.equal(r1.ok, true);
      await h.flush();
      assert.equal(a.state.round.over, false, "'số ba' còn đường nối ('ba ba')");
      assert.equal((await b.submit('ba ba')).ok, true);
      await h.flush();
      assert.equal(a.state.round.reason, 'no-move');
      assert.equal(a.state.round.winner, 1);
      await invariants(h, a, b); await h.close();
    }
    {
      const { h, a, b } = await start(backend, { config: { turnMs: 15000, noDeadEnd: true } });
      await a.submit('bàn ghế'); await h.flush();
      await b.submit('ghế gỗ'); await h.flush();
      assert.equal((await a.submit('gỗ lim')).reason, 'dead-end');
      await invariants(h, a, b); await h.close();
    }
  });

  test(`[${backend}] chơi lại: cần cả hai đồng ý, lệnh trùng không tạo sự kiện thừa, người thua đi trước`, async () => {
    const { h, a, b } = await start(backend);
    assert.equal((await b.resign()).ok, true); // bỏ cuộc được cả khi không phải lượt mình
    await h.flush();
    assert.equal(a.state.round.over, true);
    assert.equal(a.state.round.winner, 0);
    assert.equal(a.state.score.join(), '1,0');
    a.tr.fault({ dir: 'up', match: (m) => m.t === 'intent', action: 'dup' });
    await a.rematch(); await a.rematch(); await h.flush();
    assert.equal(a.state.round.over, true, 'chưa bắt đầu khi B chưa đồng ý');
    await b.rematch(); await h.flush();
    assert.equal(a.state.round.over, false);
    assert.equal(a.state.round.no, 2);
    assert.equal(a.state.round.turn, 1, 'B thua ván 1 nên đi trước');
    const { log } = await invariants(h, a, b);
    assert.equal(count(log, 'rematchRequested'), 2);
    await h.close();
  });

  test(`[${backend}] rớt mạng thoáng qua không bị bot thay; quá thời gian chờ thì bot vào ghế, người cũ lấy lại ở ván sau`, async () => {
    const { h, a, b } = await start(backend, { config: { turnMs: 60000 } });
    await a.submit('học tập'); await h.flush();           // tới lượt B
    b.tr.cut(); await h.flush();
    assert.equal(a.status, 'opponent-left');
    await h.advance(29000);
    b.tr.reconnect(); await h.flush();
    assert.equal(a.status, 'live');
    let { log } = await h.dump();
    assert.equal(count(log, 'seatChanged'), 0, 'không thay bot khi chỉ rớt 29 s');

    b.tr.cut(); await h.flush();
    await h.advance(30000);
    assert.equal(a.state.seats[1].kind, 'bot');
    await h.advance(1000);                                // bot suy nghĩ 0,5–1 s rồi đánh
    assert.equal(a.state.round.chain.length, 2);
    assert.equal(a.state.round.chain[1].word.split(' ')[0], 'tập');

    b.tr.reconnect(); await h.flush();                     // quay lại giữa ván: xem, chưa lấy lại ghế
    assert.equal(b.state.seats[1].kind, 'bot');
    assert.equal((await b.submit('vở viết')).reason, 'seat-taken-by-bot');
    await a.resign(); await h.flush();                     // hết ván ⇒ B lấy lại ghế
    assert.equal(b.state.seats[1].kind, 'human');
    assert.equal(b.state.seats[1].name, 'Bình');
    await a.rematch(); await b.rematch(); await h.flush();
    assert.equal(b.state.round.no, 2);
    ({ log } = await invariants(h, a, b));
    assert.equal(count(log, 'seatChanged'), 2);
    await h.close();
  });

  test(`[${backend}] đóng tab rồi mở lại: client mới cùng token nhận snapshot, dựng lại đúng ván; tab cũ bị đá`, async () => {
    const { h, a, b } = await start(backend);
    await a.submit('học tập'); await h.flush();
    await b.submit('tập vở'); await h.flush();
    const b2 = h.client('tok-binh');
    await h.flush();
    assert.equal(b.status, 'closed', 'tab cũ bị đóng khi cùng ghế vào nơi khác');
    assert.equal(b2.mySeat, 1);
    assert.deepEqual(b2.state.round.chain.map((x) => x.word), ['học tập', 'tập vở']);
    assert.equal(b2.fx.length, 0, 'tab mới không chạy lại hiệu ứng cũ');
    await a.submit('vở viết'); await h.flush();
    assert.equal((await b2.submit('viết thư')).ok, true);
    await invariants(h, a, b2); await h.close();
  });

  test(`[${backend}] lệch từ điển/luật ⇒ từ chối vào phòng`, async () => {
    const h = await setup(backend, HOST());
    const c = h.client('tok-an', { pin: { dictHash: 'khac', normVersion: 1, rulesVersion: 1 } });
    await h.flush();
    assert.equal(c.status, 'closed');
    assert.equal(c.rejectReason, 'pin-mismatch');
    const bad = h.client('tok-giả');
    await h.flush();
    assert.equal(bad.rejectReason, 'bad-token');
    await h.close();
  });
}
