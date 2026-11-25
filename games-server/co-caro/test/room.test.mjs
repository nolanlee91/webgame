// Test máy chủ phòng Cờ Caro qua WebSocket THẬT (WebSocket có sẵn trong Node ≥ 22) + máy chủ thật trên cổng ngẫu nhiên.
// Chạy: node --test --test-concurrency=1 games-server/co-caro/test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import * as L from '../../../prototype/games/co-caro/logic.js';
import * as A from '../../../prototype/games/co-caro/ai.js';
const require = createRequire(import.meta.url);
const { createCoCaroHost } = require('../host.js');
const { Room } = require('../room.js');

const FAST = { turn: 400, away: 150 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer(opts = {}) {
  const server = http.createServer((q, s) => s.end('x'));
  const host = createCoCaroHost(server, { timings: FAST, lobbyGraceMs: 200, ...opts });
  await host.ready;
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `ws://127.0.0.1:${server.address().port}/ws/co-caro`;
  return { url, host, server, stop: () => { host.close(); server.closeAllConnections?.(); return new Promise((r) => server.close(r)); } };
}

class Client {
  constructor(url, name) { this.url = url; this.name = name; this.raw = []; this.msgs = []; this.v = null; this.waiters = []; this.states = []; }
  async open() {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (e) => {
      this.raw.push(e.data);
      const m = JSON.parse(e.data); this.msgs.push(m);
      if (m.t === 'state') { this.v = m.v; this.states.push(m.v); }
      if (m.t === 'joined') { this.code = m.code; this.token = m.token; }
      for (const w of [...this.waiters]) if (w.f(m)) { this.waiters.splice(this.waiters.indexOf(w), 1); w.r(m); }
    };
    this.closed = new Promise((r) => (this.ws.onclose = r));
    await new Promise((r, j) => { this.ws.onopen = r; this.ws.onerror = j; });
    return this;
  }
  send(o) { this.ws.send(typeof o === 'string' ? o : JSON.stringify(o)); }
  next(f, ms = 3000) {
    if (typeof f === 'function' && this.v && f({ t: 'state', v: this.v })) return Promise.resolve({ t: 'state', v: this.v });
    return new Promise((r, j) => {
      const w = { f, r }; this.waiters.push(w);
      setTimeout(() => { const i = this.waiters.indexOf(w); if (i >= 0) { this.waiters.splice(i, 1); j(new Error(`${this.name}: hết giờ chờ — đã nhận: ${this.raw.slice(-3).map((t) => t.slice(0, 160)).join(' | ')}`)); } }, ms);
    });
  }
  async tryCmd(o, ms = 120) {
    const n = this.msgs.length; this.send(o); await sleep(ms);
    return this.msgs.slice(n).find((m) => m.t === 'err')?.code ?? null;
  }
  close() { this.ws.close(); }
}
const st = (f) => (m) => m.t === 'state' && f(m.v);

async function pair(url, create = {}) {
  const a = await new Client(url, 'A').open(), b = await new Client(url, 'B').open();
  a.send({ t: 'create', name: 'An', ...create }); await a.next((m) => m.t === 'joined');
  b.send({ t: 'join', code: a.code.toLowerCase(), name: 'Bình' }); await b.next((m) => m.t === 'joined');
  await a.next(st((v) => v.players.length === 2));
  return [a, b];
}
async function started(url, create) {
  const [a, b] = await pair(url, create);
  a.send({ t: 'start' });
  await a.next(st((v) => v.phase === 'play')); await b.next(st((v) => v.phase === 'play'));
  return [a, b];
}
// đánh nước (r,c) bởi client c rồi chờ cả hai thấy seq tăng
async function mv(c, both, r, col) {
  const seq = c.v.seq;
  c.send({ t: 'move', r, c: col });
  for (const x of both) await x.next(st((v) => v.seq > seq || v.gid !== c.v.gid));
}

test('tạo phòng (giữ cỡ bàn + luật chủ phòng chọn) + vào bằng mã không phân biệt hoa thường; người thứ 3 bị từ chối; mã sai báo no-room', async () => {
  const S = await startServer();
  try {
    const [a, b] = await pair(S.url, { size: 19, rule: 'block2' });
    assert.equal(a.v.size, 19); assert.equal(a.v.rule, 'block2'); assert.equal(b.v.size, 19);
    assert.deepEqual(a.v.players.map((p) => p.name), ['An', 'Bình']);
    assert.equal(a.v.you, 0); assert.equal(b.v.you, 1); assert.equal(b.v.host, 0);
    const c = await new Client(S.url, 'C').open();
    assert.equal(await c.tryCmd({ t: 'join', code: a.code, name: 'x' }), 'full');
    assert.equal(await c.tryCmd({ t: 'join', code: 'ZZZZ2', name: 'x' }), 'no-room');
    const d = await new Client(S.url, 'D').open();
    d.send({ t: 'create', name: 'D', size: 99, rule: 'gian-lan' }); await d.next(st((v) => true));
    assert.equal(d.v.size, 15); assert.equal(d.v.rule, 'free', 'cỡ bàn/luật lạ bị đưa về mặc định');
    for (const x of [a, b, c, d]) x.close();
  } finally { await S.stop(); }
});

test('chỉ chủ phòng bắt đầu; cần đủ 2 người; bắt đầu rồi thì không vào thêm được', async () => {
  const S = await startServer();
  try {
    const a = await new Client(S.url, 'A').open();
    a.send({ t: 'create', name: 'An' }); await a.next((m) => m.t === 'joined');
    assert.equal(await a.tryCmd({ t: 'start' }), 'need-2');
    const b = await new Client(S.url, 'B').open();
    b.send({ t: 'join', code: a.code, name: 'Bình' }); await b.next((m) => m.t === 'joined');
    assert.equal(await b.tryCmd({ t: 'start' }), 'not-host');
    a.send({ t: 'start' }); await b.next(st((v) => v.phase === 'play'));
    assert.equal(b.v.game.turn, 1, 'X (chủ phòng) đi trước ván đầu');
    const c = await new Client(S.url, 'C').open();
    assert.equal(await c.tryCmd({ t: 'join', code: a.code, name: 'x' }), 'started');
    for (const x of [a, b, c]) x.close();
  } finally { await S.stop(); }
});

test('xác thực nước đi: sai lượt, ô đã có quân, ngoài bàn, toạ độ không phải số nguyên, gửi thêm trường "p"/"board" đều bị từ chối', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    assert.equal(await b.tryCmd({ t: 'move', r: 7, c: 7 }), 'not-turn');
    await mv(a, [a, b], 7, 7);
    assert.equal(await a.tryCmd({ t: 'move', r: 7, c: 8 }), 'not-turn', 'X không đánh 2 nước liền');
    assert.equal(await b.tryCmd({ t: 'move', r: 7, c: 7 }), 'illegal', 'ô đã có quân');
    assert.equal(await b.tryCmd({ t: 'move', r: 15, c: 0 }), 'illegal', 'ngoài bàn');
    assert.equal(await b.tryCmd({ t: 'move', r: -1, c: 3 }), 'illegal');
    assert.equal(await b.tryCmd({ t: 'move', r: '7', c: 8 }), 'bad');
    assert.equal(await b.tryCmd({ t: 'move', r: 7.5, c: 8 }), 'bad');
    assert.equal(await b.tryCmd({ t: 'again' }), 'phase', 'không xin ván mới giữa ván để xoá thế thua');
    assert.equal(await b.tryCmd({ t: 'undo' }), 'bad', 'không có đi lại khi chơi online');
    // client gửi kèm quân/bàn giả → máy chủ bỏ qua, quân là của người đang có lượt
    await mv(b, [a, b], 0, 0); // O đánh hợp lệ
    a.send({ t: 'move', r: 1, c: 1, p: 2, board: [], winner: 1 }); await b.next(st((v) => v.seq === 3));
    assert.deepEqual(b.v.game.moves.at(-1), [1, 1, 1]); assert.equal(b.v.game.winner, 0);
    assert.equal(a.v.seq, 3);
    for (const x of [a, b]) x.close();
  } finally { await S.stop(); }
});

test('trạng thái gửi đi không có token; 2 máy nhận cùng một ván; dựng lại bằng logic.js từ danh sách nước ra đúng bàn/người thắng', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    // X thắng hàng ngang 7,3..7,7; O đánh hàng 0
    for (let k = 0; k < 5; k++) {
      await mv(a, [a, b], 7, 3 + k);
      if (k < 4) await mv(b, [a, b], 0, k);
    }
    await a.next(st((v) => v.phase === 'over')); await b.next(st((v) => v.phase === 'over'));
    for (const raw of [...a.raw, ...b.raw].filter((t) => !t.startsWith('{"t":"joined"'))) assert.ok(!raw.includes(a.token) && !raw.includes(b.token), 'không lộ token');
    assert.deepEqual(a.v.game, b.v.game);
    const G = a.v.game; assert.equal(G.winner, 1); assert.equal(G.score[1], 1);
    const base = { ...L.newMatch({ size: G.size, rule: G.rule }), score: G.score, round: G.round, first: G.first };
    const s = L.replay(base, G.moves);
    assert.equal(s.winner, G.winner); assert.deepEqual(s.line, G.line);
    // các seq liên tục, mỗi gói đúng 1 nước
    const seqs = b.states.filter((v) => v.phase !== 'lobby').map((v) => v.seq);
    for (let i = 1; i < seqs.length; i++) assert.ok(seqs[i] - seqs[i - 1] <= 1, 'seq không nhảy cóc: ' + seqs.join(','));
    // ván tiếp: người thua (O) đi trước, giữ tỉ số
    // BRD-09: một người bấm ⇒ người kia thấy "đối thủ muốn chơi tiếp" + hạn đếm ngược; ván chưa mở (thẻ kết quả còn đó)
    b.send({ t: 'again' }); await a.next(st((v) => v.phase === 'over' && v.again[1] === true));
    assert.deepEqual(a.v.again, [false, true]); assert.ok(a.v.againDeadline > 0);
    a.send({ t: 'again' }); await a.next(st((v) => v.phase === 'play' && v.game.round === 2));
    assert.deepEqual(a.v.again, [false, false]); assert.equal(a.v.againDeadline, 0);
    assert.equal(a.v.game.turn, 2); assert.equal(a.v.game.first, 2); assert.equal(a.v.game.score[1], 1); assert.equal(a.v.game.moves.length, 0);
    assert.equal(await a.tryCmd({ t: 'move', r: 7, c: 7 }), 'not-turn');
    for (const x of [a, b]) x.close();
  } finally { await S.stop(); }
});

test('người có lượt im lặng quá hạn → máy chủ đánh thay bằng nước hợp lệ; mất kết nối → đánh thay sớm hơn', async () => {
  const S = await startServer({ timings: { turn: 250, away: 80 } });
  try {
    const [a, b] = await started(S.url);
    await b.next(st((v) => v.seq >= 1), 1500);
    const [r, c, p] = b.v.game.moves[0];
    assert.equal(p, 1); assert.ok(b.v.act.auto, 'đánh dấu là máy đánh thay'); assert.ok(r >= 0 && c >= 0);
    // O mất kết nối khi tới lượt → máy đánh thay sau "away"
    b.close(); const t0 = Date.now();
    await a.next(st((v) => v.seq >= 2), 1500);
    assert.ok(Date.now() - t0 < 230, 'đánh thay sớm vì mất kết nối');
    assert.equal(a.v.players[1].connected, false);
    a.close();
  } finally { await S.stop(); }
});

test('rớt mạng giữa ván: giữ ghế, quay lại bằng token; token sai bị từ chối; tab cũ bị thay', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    await mv(a, [a, b], 7, 7);
    b.close(); await a.next(st((v) => !v.players[1].connected));
    const bad = await new Client(S.url, 'bad').open();
    assert.equal(await bad.tryCmd({ t: 'resume', code: a.code, token: 'f'.repeat(32) }), 'no-seat');
    const b2 = await new Client(S.url, 'B2').open();
    b2.send({ t: 'resume', code: a.code, token: b.token }); await b2.next(st((v) => v.you === 1 && v.game.moves.length === 1));
    await a.next(st((v) => v.players[1].connected));
    const b3 = await new Client(S.url, 'B3').open();
    const gone = b2.next((m) => m.t === 'replaced');
    b3.send({ t: 'resume', code: a.code, token: b.token }); await b3.next((m) => m.t === 'joined');
    await gone;
    await mv(b3, [a, b3], 8, 8);
    assert.deepEqual(a.v.game.moves.at(-1), [8, 8, 2]);
    for (const x of [a, b3, bad]) x.close();
  } finally { await S.stop(); }
});

test('một người rời giữa trận → về phòng chờ, người còn lại làm chủ, báo đối thủ đã rời; người mới vào bằng mã chơi tiếp được', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    await mv(a, [a, b], 7, 7);
    a.send({ t: 'leave' }); await a.next((m) => m.t === 'left');
    await b.next(st((v) => v.phase === 'lobby' && v.players.length === 1));
    assert.equal(b.v.you, 0); assert.equal(b.v.host, 0); assert.equal(b.v.oppLeft, true); assert.equal(b.v.game, null);
    const c = await new Client(S.url, 'C').open();
    c.send({ t: 'join', code: b.code, name: 'Chi' }); await c.next((m) => m.t === 'joined');
    b.send({ t: 'start' }); await c.next(st((v) => v.phase === 'play'));
    assert.equal(c.v.oppLeft, false); assert.equal(c.v.game.moves.length, 0); assert.deepEqual(c.v.game.score, { 1: 0, 2: 0, draw: 0 });
    assert.equal(await a.tryCmd({ t: 'move', r: 0, c: 0 }), 'no-room', 'người đã rời không gửi lệnh được nữa');
    for (const x of [a, b, c]) x.close();
  } finally { await S.stop(); }
});

test('phòng chờ: người rớt mạng quá hạn bị loại; tên được làm sạch', async () => {
  const S = await startServer();
  try {
    const a = await new Client(S.url, 'A').open();
    a.send({ t: 'create', name: '  <b>An</b>‮  ' }); await a.next((m) => m.t === 'joined');
    const b = await new Client(S.url, 'B').open();
    b.send({ t: 'join', code: a.code, name: '' }); await b.next((m) => m.t === 'joined');
    await a.next(st((v) => v.players.length === 2));
    assert.equal(a.v.players[0].name, 'bAn/b'); assert.equal(a.v.players[1].name, 'Người 2');
    b.close();
    await a.next(st((v) => v.players.length === 1), 1500);
    a.close();
  } finally { await S.stop(); }
});

test('chống spam / dữ liệu rác: JSON hỏng, mảng, khung quá cỡ, gửi dồn → bị chặn, máy chủ vẫn sống', async () => {
  const S = await startServer();
  try {
    const a = await new Client(S.url, 'A').open();
    assert.equal(await a.tryCmd('{oops'), 'bad');
    assert.equal(await a.tryCmd('[1,2]'), 'bad');
    assert.equal(await a.tryCmd({ t: 'move', r: 1, c: 1 }), 'no-room');
    for (let i = 0; i < 30; i++) a.send({ t: 'ping' });
    await sleep(100);
    assert.ok(a.msgs.some((m) => m.code === 'slow'), 'gửi dồn bị chặn');
    const big = await new Client(S.url, 'big').open();
    big.send(JSON.stringify({ t: 'create', name: 'x'.repeat(5000) }));
    await big.closed;
    const ok = await new Client(S.url, 'ok').open();
    ok.send({ t: 'create', name: 'Vẫn chạy' }); await ok.next((m) => m.t === 'joined');
    a.close(); ok.close();
  } finally { await S.stop(); }
});

test('giới hạn theo IP: một máy không mở quá 3 phòng', async () => {
  const S = await startServer();
  try {
    const cs = [];
    for (let i = 0; i < 3; i++) { const c = await new Client(S.url, 'c' + i).open(); c.send({ t: 'create', name: 'x' }); await c.next((m) => m.t === 'joined'); cs.push(c); }
    const d = await new Client(S.url, 'd').open();
    assert.equal(await d.tryCmd({ t: 'create', name: 'x' }), 'busy');
    for (const c of [...cs, d]) c.close();
  } finally { await S.stop(); }
});

test('người không có lượt ngắt/nối liên tục không kéo dài được hạn; người có lượt mất kết nối chỉ làm hạn ngắn lại (đồng hồ giả)', () => {
  let now = 0, timers = [];
  const clock = { now: () => now, setTimeout: (f, ms) => { const t = { at: now + ms, f }; timers.push(t); return t; }, clearTimeout: (t) => { timers = timers.filter((x) => x !== t); } };
  const tick = (to) => { for (;;) { const t = timers.filter((x) => x.at <= to).sort((a, b) => a.at - b.at)[0]; if (!t) break; timers = timers.filter((x) => x !== t); now = t.at; t.f(); } now = to; };
  const r = new Room({ code: 'ABCDE', L, A, clock, timings: { turn: 60000, away: 15000 } });
  r.join('A', 'ta'); r.join('B', 'tb'); r.handle(0, { t: 'start' });
  assert.equal(r.deadline, 60000);
  for (let t = 59000; t < 59900; t += 100) { tick(t); r.setConnected(1, false); r.setConnected(1, true); }
  assert.equal(r.deadline, 60000, 'hạn không bị đẩy lùi');
  tick(60001); assert.equal(r.seq, 1, 'máy chủ đánh thay đúng hạn');
  const base = r.deadline; // hạn của O = 120001
  tick(now + 50000); r.setConnected(1, false);
  assert.equal(r.deadline, base, 'mất kết nối gần hết hạn không làm hạn dài thêm');
  r.setConnected(1, true); assert.equal(r.deadline, base);
  r.setConnected(1, false); tick(now + 5000); r.setConnected(1, true); r.setConnected(1, false);
  assert.ok(r.deadline <= base);
  r.close();
});

test('server.js gắn Cờ Caro mặc định, tắt được bằng COCARO_ONLINE=0', async () => {
  const { execFileSync } = await import('node:child_process');
  const probe = (env) => execFileSync(process.execPath, ['-e', `
    const s=require('./server.js'); s.listen(0,'127.0.0.1',async()=>{const p=s.address().port;
      const ws=new WebSocket('ws://127.0.0.1:'+p+'/ws/co-caro');
      const t=setTimeout(()=>{console.log('off');process.exit(0)},800);
      ws.onopen=()=>{clearTimeout(t);console.log('on');process.exit(0)}; ws.onerror=()=>{clearTimeout(t);console.log('off');process.exit(0)};});`],
    { cwd: new URL('../../../', import.meta.url), env: { ...process.env, MASOI_ONLINE: '0', NOITU_ONLINE: '0', ...env }, encoding: 'utf8' }).trim().split('\n').pop();
  assert.equal(probe({ COCARO_ONLINE: '1' }), 'on');
  assert.equal(probe({ COCARO_ONLINE: '' }), 'on');
  assert.equal(probe({ COCARO_ONLINE: '0' }), 'off');
});

test('chat: đi qua máy chủ rồi phát cho cả phòng; tên người gửi do máy chủ gắn (không giả danh được); làm sạch; giới hạn độ dài + số tin; không lộ token; không đổi ván', async () => {
  const S = await startServer();
  try {
    const [a, b] = await started(S.url);
    const seq = a.v.seq;
    a.send({ t: 'chat', text: '  Chào‮\u0007  bạn <3  ', name: 'Bình', from: 1, mine: false, id: 999 });
    await b.next(st((v) => v.chat.length === 1));
    const [m] = b.v.chat;
    assert.equal(m.name, 'An'); assert.equal(m.text, 'Chào bạn <3'); assert.equal(m.mine, false); assert.equal(m.id, 1);
    await a.next(st((v) => v.chat.length === 1)); assert.equal(a.v.chat[0].mine, true);
    assert.equal(a.v.seq, seq); assert.equal(a.v.phase, 'play');
    for (const raw of [...a.raw, ...b.raw].filter((t) => !t.startsWith('{"t":"joined"'))) { assert.ok(!raw.includes(a.token) && !raw.includes(b.token)); }
    assert.equal(await b.tryCmd({ t: 'chat', text: '   ' }), 'bad');
    assert.equal(await b.tryCmd({ t: 'chat', text: 42 }), 'bad');
    assert.equal(await b.tryCmd({ t: 'chat' }), 'bad');
    assert.equal(await b.tryCmd({ t: 'chat', text: 'x'.repeat(201) }), 'long');
    assert.equal(await b.tryCmd({ t: 'chat', text: 'đ'.repeat(200) }), null);
    // b đã gửi 1 tin hợp lệ; gửi dồn thêm → tối đa 4 tin liền rồi bị chặn
    const errs = [];
    for (let k = 0; k < 5; k++) errs.push(await b.tryCmd({ t: 'chat', text: 'spam ' + k }, 20));
    assert.deepEqual(errs.slice(0, 3), [null, null, null]); assert.equal(errs[3], 'chat-slow'); assert.equal(errs[4], 'chat-slow');
    await sleep(1600); // hồi lại ≥ 1 tin
    assert.equal(await b.tryCmd({ t: 'chat', text: 'hết spam' }), null);
    await a.next(st((v) => v.chat.at(-1)?.text === 'hết spam'));
    assert.ok(a.v.chat.every((c) => c.name === 'An' || c.name === 'Bình'));
    // người ngoài phòng không chat được
    const z = await new Client(S.url, 'Z').open();
    assert.equal(await z.tryCmd({ t: 'chat', text: 'xin chào' }), 'no-room');
  } finally { await S.stop(); }
});

test('chat: chỉ giữ 40 tin gần nhất của phòng; người vào lại thấy lại tin trong phòng', () => {
  let t = 0; const clock = { now: () => t, setTimeout: () => 0, clearTimeout() {} };
  const r = new Room({ code: 'AAAAA', L, A, clock });
  r.join('An', 'a'.repeat(32)); r.join('Bình', 'b'.repeat(32));
  for (let k = 0; k < 50; k++) { t += 5000; assert.deepEqual(r.handle(k % 2, { t: 'chat', text: 'tin ' + k }), { ok: true }); }
  const v = r.viewFor(1);
  assert.equal(v.chat.length, 40); assert.equal(v.chat[0].text, 'tin 10'); assert.equal(v.chat.at(-1).text, 'tin 49');
  assert.equal(v.chat.at(-1).mine, true); assert.equal(v.chat.at(-2).mine, false);
  assert.ok(!JSON.stringify(v).includes('a'.repeat(32)));
});

test('server.js: WebSocket tới đường không có game nào nhận (game online đang tắt) bị ngắt đột ngột → server KHÔNG sập', async () => {
  const { execFileSync } = await import('node:child_process');
  const out = execFileSync(process.execPath, ['-e', `
    const net=require('net'); const s=require('./server.js');
    s.listen(0,'127.0.0.1',()=>{const p=s.address().port;
      const c=net.connect(p,'127.0.0.1',()=>{c.write('GET /ws/khong-co HTTP/1.1\\r\\nHost: x\\r\\nUpgrade: websocket\\r\\nConnection: Upgrade\\r\\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\\r\\nSec-WebSocket-Version: 13\\r\\n\\r\\n'); setTimeout(()=>c.resetAndDestroy(),50);});
      c.on('error',()=>{});
      setTimeout(()=>{require('http').get('http://127.0.0.1:'+p+'/',(r)=>{console.log('alive '+r.statusCode);process.exit(0)});},400);});`],
    { cwd: new URL('../../../', import.meta.url), env: { ...process.env, MASOI_ONLINE: '0', NOITU_ONLINE: '0', COCARO_ONLINE: '0', COCANGUA_ONLINE: '0' }, encoding: 'utf8' }).trim().split('\n').pop();
  assert.match(out, /^alive /);
});

test('chat (review Codex): hạn mức theo IP sống suốt đời phòng — rời/vào lại hay mở kết nối phụ cùng IP không làm đầy lại; người cùng nhà vẫn đủ phần; lọc đủ ký tự bidi', () => {
  const { Chat } = require('../chat.js');
  let t = 0; const c = new Chat({ now: () => t });
  const IP = '1.2.3.4';
  const a = { token: 'a', name: 'A', ip: IP }, a2 = { token: 'a2', name: 'A', ip: IP }, d = { token: 'd', name: 'D', ip: IP };
  for (let i = 0; i < 4; i++) assert.equal(c.post(a, 'tin ' + i, 1).ok, true);
  assert.equal(c.post(a, 'tin 5', 1).err, 'chat-slow');
  c.forget('a');
  assert.equal(c.post(a2, 'vào lại', 1).err, 'chat-slow', 'token mới cùng IP vẫn bị giới hạn');
  // kết nối phụ D cùng IP ngồi vào trước rồi A mới vào lại (cách lách Codex chỉ ra): cả hai vẫn bị chặn
  assert.equal(c.post(d, 'phụ', 2).err, 'chat-slow', 'kết nối phụ cùng IP không có hạn mức mới');
  assert.equal(c.post(a2, 'vào lại lần 2', 2).err, 'chat-slow');
  t += 1500; // hồi theo thời gian: 2 ghế cùng IP → hồi 2 × 0,7/giây
  assert.equal(c.post(a2, 'hồi lại', 2).ok, true);
  assert.equal(c.post(d, 'hồi lại', 2).ok, true);
  assert.equal(c.post(d, 'thêm', 2).err, 'chat-slow', 'hết phần chung của IP');
  // hai người chung mạng (cùng nhà) vào phòng mới: mỗi người vẫn 4 tin liền
  const h = new Chat({ now: () => t });
  const p1 = { token: 'p1', name: 'P1', ip: '9.9.9.9' }, p2 = { token: 'p2', name: 'P2', ip: '9.9.9.9' };
  for (let i = 0; i < 4; i++) { assert.equal(h.post(p1, 'x' + i, 2).ok, true); assert.equal(h.post(p2, 'y' + i, 2).ok, true); }
  assert.equal(h.post(p1, 'z', 2).err, 'chat-slow');
  const b = { token: 'b', name: 'B', ip: '5.6.7.8' };
  const ctl = [0x61c, 0x200e, 0x200f, 0x202a, 0x202e, 0x2066, 0x2069, 0x2060, 0xfeff].map((x) => String.fromCharCode(x)).join('');
  assert.equal(c.post(b, 'abc' + ctl + 'def', 1).ok, true);
  const last = c.view('x').at(-1).text;
  assert.equal(last, 'abc def'); assert.ok(![...last].some((ch) => ch.charCodeAt(0) > 0x7e && ch.charCodeAt(0) < 0x2100 && !/\p{L}/u.test(ch)));
});
