// Nối Từ online: máy chủ thật (cổng ngẫu nhiên) + người chơi giả qua WebSocket THẬT.
// Kiểm tra: phòng theo mã, server quyết lượt/từ/đồng hồ, chống giả mạo ghế/token, gửi lại lệnh, đồng bộ lại.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { reduce, pinOf, validate } from '../../../prototype/games/noi-tu/core/rules.js';
import { createDict } from '../../../prototype/games/noi-tu/core/dict.js';
import { lastSyl } from '../../../prototype/games/noi-tu/core/normalize.js';
import { fakeScheduler } from '../../../prototype/games/noi-tu/session/scheduler.js';
import { MatchClient } from '../../../prototype/games/noi-tu/session/client.js';
import { realScheduler } from '../../../prototype/games/noi-tu/session/scheduler.js';

const require = createRequire(import.meta.url);
const { createNoiTuHost, cleanName } = require('../host.js');
const dict = createDict(JSON.parse(fs.readFileSync(new URL('../../../prototype/games/noi-tu/data/words.json', import.meta.url), 'utf8')));
const PIN = pinOf(dict);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer(opts = {}) {
  const server = http.createServer((q, s) => s.end('x'));
  const host = createNoiTuHost(server, opts);
  await host.ready;
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `ws://127.0.0.1:${server.address().port}/ws/noi-tu`;
  return { url, host, stop: () => { host.close(); server.closeAllConnections?.(); return new Promise((r) => server.close(r)); } };
}

/** Người chơi giả: tự dựng state từ snapshot + event giống client thật. */
class P {
  constructor(url, name) { this.url = url; this.name = name; this.msgs = []; this.waiters = []; this.state = null; this.n = 0; }
  async open() {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data); this.msgs.push(m);
      if (m.t === 'room') { this.code = m.code; this.token = m.token; this.seat = m.seat; }
      if (m.t === 'snapshot') this.state = m.state;
      if (m.t === 'event' && this.state && m.ev.seq === this.state.seq + 1) this.state = reduce(this.state, m.ev);
      for (const w of [...this.waiters]) if (w.f(m)) { this.waiters.splice(this.waiters.indexOf(w), 1); w.r(m); }
    };
    this.closed = new Promise((r) => { this.ws.onclose = (e) => r(e.code); });
    await new Promise((r, j) => { this.ws.onopen = r; this.ws.onerror = j; });
    return this;
  }
  send(o) { this.ws.send(typeof o === 'string' ? o : JSON.stringify(o)); }
  next(f, ms = 3000) {
    const hit = this.msgs.find((m) => f(m) && !m._used);
    if (hit) { hit._used = true; return Promise.resolve(hit); }
    return new Promise((r, j) => {
      const w = { f: (m) => (f(m) ? (m._used = true) : false), r }; this.waiters.push(w);
      setTimeout(() => { const i = this.waiters.indexOf(w); if (i >= 0) { this.waiters.splice(i, 1); j(new Error(`${this.name}: hết giờ chờ`)); } }, ms);
    });
  }
  async join() { this.send({ t: 'join', pin: PIN }); await this.next((m) => m.t === 'welcome'); await this.next((m) => m.t === 'snapshot'); }
  /** gửi ý định, chờ đúng kết quả của commandId đó */
  async intent(body, cid = `k${++this.n}${Math.random().toString(36).slice(2, 6)}`) {
    const s = this.state;
    this.send({ t: 'intent', commandId: cid, matchId: s.matchId, roundId: s.round?.id ?? null, ...body });
    return (await this.next((m) => m.t === 'result' && m.commandId === cid)).res;
  }
  submit(word, extra = {}) { return this.intent({ type: 'submit', word, expectedSeq: this.state.seq, ...extra }); }
  close() { this.ws.close(); }
}

/** Tạo phòng 2 người qua mã, cả hai đã join trọng tài. */
async function pair(url) {
  const a = await new P(url, 'A').open(), b = await new P(url, 'B').open();
  a.send({ t: 'create', name: 'An' }); await a.next((m) => m.t === 'room');
  b.send({ t: 'enter', code: a.code.toLowerCase(), name: 'Bình' }); await b.next((m) => m.t === 'room');
  await a.next((m) => m.t === 'lobby' && m.started);
  await b.next((m) => m.t === 'lobby' && m.started);
  await a.join(); await b.join();
  return [a, b];
}
const turnOf = (a, b) => (a.state.round.turn === a.seat ? [a, b] : [b, a]);
/** từ hợp lệ cho người đang tới lượt (không dẫn vào ngõ cụt để ván không kết thúc sớm) */
function goodWord(s, seat) {
  const prev = s.round.chain.at(-1);
  const pool = prev ? dict.startsWith(lastSyl(prev.word)) : dict.all();
  return pool.find((w) => { const v = validate(s, seat, w, dict); return v.ok && !v.deadEnd; });
}

test('2 người chơi qua mã phòng: server quyết lượt, từ hợp lệ, cả hai thấy cùng một chuỗi', async () => {
  const S = await startServer();
  try {
    const [a, b] = await pair(S.url);
    assert.notEqual(a.seat, b.seat);
    assert.deepEqual(a.state.seats.map((x) => x.name), ['An', 'Bình']);
    for (let i = 0; i < 4; i++) {
      const [me, other] = turnOf(a, b);
      const w = goodWord(me.state, me.seat);
      const res = await me.submit(w);
      assert.equal(res.ok, true, JSON.stringify(res));
      await other.next((m) => m.t === 'event' && m.ev.type === 'played' && m.ev.word === w);
    }
    await sleep(50);
    assert.equal(a.state.seq, b.state.seq);
    assert.deepEqual(a.state.round.chain, b.state.round.chain);
    assert.equal(a.state.round.chain.length, 4);
  } finally { await S.stop(); }
});

test('chống gian lận: sai lượt, sai vần, từ không có, từ đã dùng, seq cũ, sai ván đều bị từ chối và không tốn seq', async () => {
  const S = await startServer();
  try {
    const [a, b] = await pair(S.url);
    const [me, other] = turnOf(a, b);
    const seq0 = me.state.seq;
    assert.equal((await other.submit(goodWord(me.state, me.seat))).reason, 'not-your-turn');
    assert.equal((await me.submit('xyz abc')).reason, 'not-in-dict');
    assert.equal((await me.submit('một')).reason, 'need-two-syllables');
    const w = goodWord(me.state, me.seat);
    assert.equal((await me.submit(w, { expectedSeq: seq0 - 1 })).reason, 'stale');
    assert.equal((await me.submit(w, { matchId: 'nt-FAKE' })).reason, 'wrong-match');
    assert.equal((await me.submit(w, { roundId: 'r-gia' })).reason, 'stale-round');
    assert.equal(me.state.seq, seq0, 'lệnh bị từ chối không sinh sự kiện');
    assert.equal((await me.submit(w)).ok, true);
    await other.next((m) => m.t === 'event' && m.ev.type === 'played');
    // sai vần: từ không bắt đầu bằng âm cuối của từ trước
    const need = lastSyl(w);
    const wrong = dict.all().find((x) => !x.startsWith(need + ' ') && !other.state.round.used.includes(x));
    assert.equal((await other.submit(wrong)).reason, 'wrong-link');
    // từ đã dùng
    assert.match((await other.submit(w)).reason, /already-used|wrong-link/);
  } finally { await S.stop(); }
});

test('không giả được ghế/token: token gửi kèm bị bỏ qua, intent sai hình dạng bị chặn trước trọng tài', async () => {
  const S = await startServer();
  try {
    const [a, b] = await pair(S.url);
    const [me, other] = turnOf(a, b);
    // người không tới lượt gửi kèm token của đối thủ ⇒ server vẫn dùng token của kết nối
    const cid = 'forge1';
    other.send({ t: 'intent', commandId: cid, token: me.token, seat: me.seat, matchId: me.state.matchId, roundId: me.state.round.id, type: 'submit', word: goodWord(me.state, me.seat), expectedSeq: me.state.seq });
    assert.equal((await other.next((m) => m.t === 'result' && m.commandId === cid)).res.reason, 'not-your-turn');
    // join bằng token của người khác cũng không được: host ép token theo kết nối
    other.send({ t: 'join', token: me.token, pin: PIN });
    const w = await other.next((m) => m.t === 'welcome');
    assert.equal(w.seat, other.seat);
    // intent sai hình dạng
    for (const bad of [
      { t: 'intent', commandId: 'x y', type: 'submit', matchId: me.state.matchId, word: 'a b', expectedSeq: 1 },
      { t: 'intent', commandId: 'ok1', type: 'cheat', matchId: me.state.matchId },
      { t: 'intent', commandId: 'ok2', type: 'submit', matchId: me.state.matchId, word: 'x'.repeat(41), expectedSeq: 1 },
      { t: 'intent', commandId: 'ok3', type: 'submit', matchId: me.state.matchId, word: { a: 1 }, expectedSeq: 1 },
      { t: 'intent', commandId: 'ok4', type: 'submit', matchId: me.state.matchId, word: 'a b', expectedSeq: '1' },
      { t: 'intent', commandId: 'ok5', type: 'submit', matchId: me.state.matchId, expectedSeq: 1 },
      { t: 'snapshot', state: {} }, { t: 'event', ev: { type: 'roundEnded', winner: 0 } }, [1, 2], 'không phải json',
    ]) {
      const n = me.msgs.length; me.send(bad); await sleep(60);
      const got = me.msgs.slice(n);
      assert.ok(got.some((m) => m.t === 'err' && m.code === 'bad'), `phải chặn: ${JSON.stringify(bad)}`);
      assert.ok(!got.some((m) => m.t === 'event'), 'không được sinh sự kiện');
      if (bad.commandId && /^ok/.test(bad.commandId)) assert.ok(got.some((m) => m.t === 'result' && m.commandId === bad.commandId && m.res.reason === 'bad-command'), 'client cần kết quả để ngừng gửi lại');
    }
    // thông điệp quá lớn ⇒ đóng kết nối
    const z = await new P(S.url, 'Z').open();
    z.send('x'.repeat(5000));
    assert.ok(await Promise.race([z.closed, sleep(1000).then(() => false)]), 'quá 1 KB phải bị đóng');
  } finally { await S.stop(); }
});

test('gửi lại cùng commandId (mạng chập chờn) chỉ đánh MỘT lần', async () => {
  const S = await startServer();
  try {
    const [a, b] = await pair(S.url);
    const [me, other] = turnOf(a, b);
    const seq0 = me.state.seq;
    const w = goodWord(me.state, me.seat);
    const body = { type: 'submit', word: w, expectedSeq: seq0 };
    const r1 = await me.intent(body, 'dup-1');
    me.state = { ...me.state, seq: seq0 }; // gửi lại y nguyên (như client chưa nhận được kết quả)
    const r2 = await me.intent(body, 'dup-1');
    assert.equal(r1.ok, true); assert.deepEqual(r2, r1);
    await sleep(80);
    assert.equal(other.state.seq, seq0 + 1);
    assert.equal(other.msgs.filter((m) => m.t === 'event' && m.ev.type === 'played').length, 1);
  } finally { await S.stop(); }
});

test('đồng hồ chạy trên server: hết 15 giây không đánh ⇒ thua vì hết giờ, đánh muộn bị từ chối', async () => {
  const sch = fakeScheduler(1_000_000);
  const S = await startServer({ scheduler: sch });
  try {
    const [a, b] = await pair(S.url);
    const [me, other] = turnOf(a, b);
    const w = goodWord(me.state, me.seat);
    sch.advance(15_001);
    const end = await other.next((m) => m.t === 'event' && m.ev.type === 'roundEnded');
    assert.equal(end.ev.reason, 'timeout'); assert.equal(end.ev.winner, other.seat);
    await me.next((m) => m.t === 'event' && m.ev.type === 'roundEnded');
    assert.equal((await me.submit(w)).ok, false);
    // chơi lại cần CẢ HAI đồng ý
    assert.equal((await me.intent({ type: 'rematch' })).ok, true);
    await sleep(60);
    assert.equal(me.state.round.over, true);
    assert.equal((await other.intent({ type: 'rematch' })).ok, true);
    await other.next((m) => m.t === 'event' && m.ev.type === 'roundStarted');
  } finally { await S.stop(); }
});

test('mất gói ⇒ client thật (MatchClient) tự xin snapshot và khớp lại với server', async () => {
  const S = await startServer();
  try {
    const [a, b] = await pair(S.url);
    // B dùng MatchClient thật trên kết nối mới (resume), làm rơi 1 sự kiện để giả lập lệch
    const ws = new WebSocket(S.url);
    let h, drop = true;
    const transport = { attach(x) { h = x; }, send(m) { ws.send(JSON.stringify(m)); }, close() { ws.close(); } };
    const mc = new MatchClient({ transport, token: b.token, pin: PIN, scheduler: realScheduler(), retryMs: 200 });
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.t === 'room') return h.onOpen();
      if (m.t === 'event' && m.ev.type === 'played' && drop) { drop = false; return; } // rơi gói
      h.onMessage(m);
    };
    await new Promise((r) => { ws.onopen = r; });
    ws.send(JSON.stringify({ t: 'resume', code: b.code, token: b.token }));
    await b.next((m) => m.t === 'replaced');
    await sleep(150);
    assert.equal(mc.status, 'live');
    // A đánh 2 nước (A và B đổi lượt bằng MatchClient)
    // tới lượt A thì A đánh (sự kiện này bị rơi ở B); nếu không thì B đánh trước 1 nước cho tới lượt A
    if (a.state.round.turn !== a.seat) { assert.equal((await mc.submit(goodWord(mc.state, mc.mySeat))).ok, true); await sleep(120); drop = true; }
    assert.equal((await a.submit(goodWord(a.state, a.seat))).ok, true);
    await sleep(120);
    assert.notEqual(mc.seq, a.state.seq, 'B đang lệch vì rơi gói');
    // B đánh theo cái mình thấy (seq cũ) ⇒ server trả 'stale' kèm seq mới ⇒ client tự xin snapshot
    const r1 = await mc.submit(goodWord(a.state, mc.mySeat));
    assert.equal(r1.reason, 'stale');
    await sleep(300);
    assert.equal(mc.seq, a.state.seq);
    assert.equal((await mc.submit(goodWord(mc.state, mc.mySeat))).ok, true);
    await sleep(400);
    assert.equal(mc.seq, a.state.seq);
    assert.deepEqual(mc.state.round.chain, a.state.round.chain);
    mc.dispose();
  } finally { await S.stop(); }
});

test('phòng: đầy, trùng tên, sai mã, quay lại bằng token, chủ phòng rời phòng chờ', async () => {
  const S = await startServer();
  try {
    const [a, b] = await pair(S.url);
    const c = await new P(S.url, 'C').open();
    c.send({ t: 'enter', code: a.code, name: 'Chen' });
    assert.equal((await c.next((m) => m.t === 'err')).code, 'full');
    c.send({ t: 'enter', code: 'ZZZZZ', name: 'Chen' });
    assert.equal((await c.next((m) => m.t === 'err')).code, 'no-room');
    c.send({ t: 'resume', code: a.code, token: '0'.repeat(32) });
    assert.equal((await c.next((m) => m.t === 'err')).code, 'no-seat');
    c.send({ t: 'intent', commandId: 'x', type: 'resign', matchId: a.state.matchId });
    assert.equal((await c.next((m) => m.t === 'err')).code, 'no-room');
    // quay lại bằng token (tab mới) ⇒ tab cũ bị thay, ghế giữ nguyên
    const a2 = await new P(S.url, 'A2').open();
    a2.send({ t: 'resume', code: a.code, token: a.token });
    const r = await a2.next((m) => m.t === 'room');
    assert.equal(r.seat, a.seat); assert.equal(r.started, true);
    await a.next((m) => m.t === 'replaced');
    await a2.join();
    assert.equal(a2.state.seq, b.state.seq);

    // trùng tên + chủ phòng rời phòng chờ ⇒ phòng đóng
    const h = await new P(S.url, 'H').open(), g = await new P(S.url, 'G').open();
    h.send({ t: 'create', name: '  Hoa‮\u0000 ' }); await h.next((m) => m.t === 'room');
    g.send({ t: 'enter', code: h.code, name: 'hoa' });
    assert.equal((await g.next((m) => m.t === 'err')).code, 'name-taken');
    h.send({ t: 'leave' });
    await h.next((m) => m.t === 'left');
    g.send({ t: 'enter', code: h.code, name: 'Giang' });
    assert.equal((await g.next((m) => m.t === 'err')).code, 'no-room');
  } finally { await S.stop(); }
});

test('giới hạn: số phòng mỗi IP, gửi dồn dập bị chặn', async () => {
  const S = await startServer({ maxRoomsPerIp: 2 });
  try {
    const ps = [];
    for (let i = 0; i < 3; i++) { const p = await new P(S.url, `R${i}`).open(); ps.push(p); p.send({ t: 'create', name: `Chủ ${i}` }); }
    assert.equal((await ps[2].next((m) => m.t === 'err')).code, 'busy');
    const spam = await new P(S.url, 'S').open();
    for (let i = 0; i < 40; i++) spam.send({ t: 'ping' });
    await sleep(100);
    assert.ok(spam.msgs.some((m) => m.t === 'err' && m.code === 'slow'));
  } finally { await S.stop(); }
});

test('ghế chưa từng join (chủ phòng đóng tab trước khi khách vào) ⇒ sau 30 s bot thay, ván không kẹt', async () => {
  const sch = fakeScheduler(1_000_000);
  const S = await startServer({ scheduler: sch });
  try {
    const a = await new P(S.url, 'A').open(), b = await new P(S.url, 'B').open();
    a.send({ t: 'create', name: 'An' }); await a.next((m) => m.t === 'room');
    a.close(); await a.closed; await sleep(30);
    b.send({ t: 'enter', code: a.code, name: 'Bình' }); await b.next((m) => m.t === 'room');
    await b.next((m) => m.t === 'lobby' && m.started); await b.join();
    assert.equal(b.state.seats[a.seat].kind, 'human');
    sch.advance(30_001);
    await b.next((m) => m.t === 'event' && m.ev.type === 'seatChanged' && m.ev.seat === a.seat && m.ev.kind === 'bot');
    assert.equal(b.state.seats[a.seat].kind, 'bot');
    // join kịp trong 30 s ⇒ không bị thay
    const [c, d] = await pair(S.url);
    sch.advance(30_001); await sleep(40);
    assert.equal(c.state.seats[0].kind, 'human'); assert.equal(d.state.seats[1].kind, 'human');
  } finally { await S.stop(); }
});

test('WebSocket: nhiều khung hợp lệ gộp trong một lần ghi TCP không bị đóng nhầm (1009)', async () => {
  const net = await import('node:net');
  const S = await startServer();
  try {
    const { port } = new URL(S.url);
    const sock = net.connect(Number(port), '127.0.0.1');
    await new Promise((r) => sock.once('connect', r));
    sock.write(`GET /ws/noi-tu HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n`);
    let got = '';
    sock.on('data', (d) => { got += d.toString('latin1'); });
    await sleep(80); assert.match(got, /101 Switching/);
    const frame = (text) => {
      const p = Buffer.from(text), mask = Buffer.from([1, 2, 3, 4]);
      const head = p.length < 126 ? Buffer.from([0x81, 0x80 | p.length]) : Buffer.from([0x81, 0x80 | 126, p.length >> 8, p.length & 255]);
      return Buffer.concat([head, mask, Buffer.from(p.map((x, i) => x ^ mask[i & 3]))]);
    };
    const msg = JSON.stringify({ t: 'ping', id: 1, pad: 'x'.repeat(560) }); // ~600 byte, dưới giới hạn 1024
    assert.ok(msg.length > 550 && msg.length < 1024);
    let closed = null; sock.on('close', () => { closed = true; });
    sock.write(Buffer.concat([frame(msg), frame(msg), frame(msg)]));  // ~1.8 KB trong MỘT lần ghi
    await sleep(120);
    assert.equal(closed, null, 'không được đóng kết nối');
    assert.ok(!/\x88\x02\x03\xf1/.test(got), 'không có khung close 1009');
    assert.equal((got.match(/no-room/g) || []).length, 3, 'cả 3 thông điệp đều được xử lý');
    // khung đơn lẻ vượt giới hạn vẫn bị đóng
    sock.write(frame(JSON.stringify({ t: 'ping', pad: 'x'.repeat(1100) })));
    await sleep(120); assert.equal(closed, true);
  } finally { await S.stop(); }
});

test('cleanName bỏ ký tự điều khiển/định hướng, tối đa 16 ký tự', () => {
  assert.equal(cleanName('  Hoa‮\u0000  Lan '), 'Hoa Lan');
  assert.equal(cleanName('x'.repeat(30)).length, 16);
  assert.equal(cleanName(42), '');
});

test('chat: qua máy chủ, phát cho cả 2 ghế kèm tên do server gắn; lọc ký tự lạ + cắt 200; chặn spam theo ghế; vào lại nhận lịch sử', async () => {
  const S = await startServer();
  try {
    const [a, b] = await pair(S.url);
    a.send({ t: 'chat', text: '  chào‮  bạn\u0000 ', seat: 1, name: 'Giả mạo' });
    const ma = await a.next((m) => m.t === 'chat'), mb = await b.next((m) => m.t === 'chat');
    assert.deepEqual([ma.seat, ma.name, ma.text], [a.seat, 'An', 'chào bạn']);
    assert.deepEqual(mb, { ...ma, _used: true });
    b.send({ t: 'chat', text: 'x'.repeat(300) });
    assert.equal((await a.next((m) => m.t === 'chat' && m.seat === b.seat)).text.length, 200);
    a.send({ t: 'chat', text: '   ' }); assert.equal((await a.next((m) => m.t === 'err')).code, 'chat-empty');
    // a đã dùng 1/5 tin (tin rỗng không tính) ⇒ thêm 4 tin qua, tin thứ 5 bị chặn
    for (let i = 0; i < 5; i++) a.send({ t: 'chat', text: `spam ${i}` });
    assert.equal((await a.next((m) => m.t === 'err')).code, 'chat-slow');
    await sleep(100);
    assert.equal(b.msgs.filter((m) => m.t === 'chat' && m.text.startsWith('spam')).length, 4);
    // người ngoài phòng không chat được
    const x = await new P(S.url, 'X').open(); x.send({ t: 'chat', text: 'hi' });
    assert.equal((await x.next((m) => m.t === 'err')).code, 'no-room');
    // b tải lại trang (resume) ⇒ nhận lại lịch sử chat của phòng
    const b2 = await new P(S.url, 'B2').open(); b2.send({ t: 'resume', code: a.code, token: b.token });
    const log = await b2.next((m) => m.t === 'chatlog');
    assert.equal(log.items.length, 6); assert.equal(log.items[0].text, 'chào bạn');
  } finally { await S.stop(); }
});
