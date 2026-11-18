// Test máy chủ phòng Đặt Bom qua WebSocket THẬT (WebSocket có sẵn trong Node ≥ 22) + máy chủ thật trên cổng ngẫu nhiên.
// Giả lập 2–4 người chơi cùng lúc. Chạy: node --test --test-concurrency=1 games-server/dat-bom/test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import * as L from '../../../prototype/games/dat-bom/logic.js';
const require = createRequire(import.meta.url);
const { createDatBomHost } = require('../host.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FAST = { countdown: 0, fuse: 300, flame: 150 };

async function startServer(opts = {}) {
  const server = http.createServer((q, s) => s.end('x'));
  const host = createDatBomHost(server, { lobbyGraceMs: 200, logic: L, rand: () => 0.99, rules: FAST, ...opts });
  await host.ready;
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `ws://127.0.0.1:${server.address().port}/ws/dat-bom`;
  return { url, host, server, stop: () => { host.close(); server.closeAllConnections?.(); return new Promise((r) => server.close(r)); } };
}

class Client {
  constructor(url, name) { this.url = url; this.name = name; this.msgs = []; this.v = null; this.f = null; this.frames = 0; this.waiters = []; }
  async open() {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data); this.msgs.push(m);
      if (m.t === 'state') this.v = m.v;
      if (m.t === 'f') { this.f = m; this.frames++; }
      for (const w of [...this.waiters]) if (w.pred(m, this)) { this.waiters.splice(this.waiters.indexOf(w), 1); w.res(m); }
    };
    this.closed = new Promise((r) => (this.ws.onclose = (e) => r(e.code)));
    await new Promise((r, j) => { this.ws.onopen = r; this.ws.onerror = j; });
    return this;
  }
  send(o) { this.ws.send(JSON.stringify(o)); }
  wait(pred, ms = 3000, label = '') {
    for (const m of this.msgs) if (pred(m, this)) return Promise.resolve(m);
    return new Promise((res, rej) => {
      const w = { pred, res }; this.waiters.push(w);
      setTimeout(() => rej(new Error(`${this.name}: hết giờ chờ ${label}`)), ms);
    });
  }
  next(pred, ms, label) { const n = this.msgs.length; return this.wait((m, c) => c.msgs.indexOf(m) >= n && pred(m), ms, label); }
  state(pred, ms, label) { return this.wait((m) => m.t === 'state' && pred(m.v), ms, label).then((m) => m.v); }
}

async function room(url, n, opts = {}) {
  const cs = [];
  const a = await new Client(url, 'A').open();
  a.send({ t: 'create', name: 'An', public: !!opts.public });
  const j = await a.wait((m) => m.t === 'joined');
  cs.push(a);
  for (let k = 1; k < n; k++) {
    const c = await new Client(url, 'P' + k).open();
    c.send({ t: 'join', code: j.code, name: 'Người ' + k });
    await c.wait((m) => m.t === 'joined');
    cs.push(c);
  }
  await a.state((v) => v.players.length === n);
  return { code: j.code, cs };
}

test('4 người: tạo phòng, vào phòng, chat, bắt đầu, ai cũng nhận khung ván 20 lần/giây', async () => {
  const s = await startServer();
  try {
    const { code, cs } = await room(s.url, 4);
    assert.match(code, /^[A-HJKMNP-Z2-9]{5}$/);
    const [a, b, c, d] = cs;
    // người thứ 5 bị từ chối
    const e = await new Client(s.url, 'E').open();
    e.send({ t: 'join', code, name: 'Thừa' });
    assert.equal((await e.wait((m) => m.t === 'err')).code, 'full');
    // chỉ chủ phòng mới bắt đầu được
    b.send({ t: 'start' });
    assert.equal((await b.wait((m) => m.t === 'err')).code, 'not-host');
    // chat: mọi người thấy, tên người gửi do máy chủ gán
    c.send({ t: 'chat', text: 'Chào cả nhà <b>' });
    for (const x of cs) await x.state((v) => v.chat.some((m) => m.text === 'Chào cả nhà <b>' && m.name === 'Người 2'));
    assert.equal(c.v.chat.at(-1).mine, true); assert.equal(a.v.chat.at(-1).mine, false);
    assert.ok(!JSON.stringify(a.v).includes(c.v.chat.at(-1).tok || 'zzz'));
    a.send({ t: 'start' });
    for (const x of cs) await x.state((v) => v.phase === 'play');
    const t0 = Date.now(); const f0 = d.frames;
    await sleep(1000);
    const rate = (d.frames - f0) / ((Date.now() - t0) / 1000);
    assert.ok(rate > 14 && rate < 24, `khung/giây = ${rate}`);
    assert.equal(d.f.p.length, 4);
    assert.deepEqual(d.f.p.map((p) => [p[0], p[1]]), L.SPAWNS.map(([x, y]) => [x, y]));
    assert.equal(d.f.g.length, L.W * L.H);
    // người ngoài không vào được ván đang chơi
    const late = await new Client(s.url, 'late').open();
    late.send({ t: 'join', code, name: 'Muộn' });
    assert.equal((await late.wait((m) => m.t === 'err')).code, 'started');
    for (const x of [...cs, e, late]) x.ws.close();
  } finally { await s.stop(); }
});

test('di chuyển: máy chủ nhận vị trí hợp lệ, trả "fix" khi dịch chuyển tức thời / xuyên tường', async () => {
  const s = await startServer();
  try {
    const { cs: [a, b] } = await room(s.url, 2);
    a.send({ t: 'start' });
    await a.state((v) => v.phase === 'play');
    await sleep(60);
    // đi phải đúng tốc độ ~ 3,2 ô/s, gói 50 ms một lần
    let x = 1;
    for (let k = 0; k < 10; k++) { await sleep(50); x = Math.round((x + 0.15) * 1000) / 1000; a.send({ t: 'mv', x, y: 1, d: 'r' }); }
    await b.wait((m) => m.t === 'f' && Math.abs(m.p[0][0] - x) < 1e-6, 2000, 'b thấy a đi');
    assert.ok(!a.msgs.some((m) => m.t === 'fix'), 'đi đúng thì không bị sửa');
    // dịch chuyển tức thời
    a.send({ t: 'mv', x: 9, y: 1, d: 'r' });
    const fx = await a.next((m) => m.t === 'fix', 1000, 'fix');
    assert.ok(Math.abs(fx.x - x) < 1e-6 && fx.y === 1);
    // xuyên cột (2,2)
    a.send({ t: 'mv', x: 2, y: 1.2, d: 'd' });
    await a.next((m) => m.t === 'fix', 1000, 'fix cột');
    // gói vị trí sai khuôn (không bắt đầu bằng {"t":"mv") bị từ chối
    a.ws.send(JSON.stringify({ x: 1, t: 'mv', y: 1 }));
    assert.equal((await a.next((m) => m.t === 'err', 1000)).code, 'bad');
    a.ws.close(); b.ws.close();
  } finally { await s.stop(); }
});

test('trọn ván: đặt bom, lửa hạ người kia, người còn lại thắng, cộng trận thắng, chơi ván mới', async () => {
  const s = await startServer();
  try {
    const { cs: [a, b] } = await room(s.url, 2);
    a.send({ t: 'start' });
    await a.state((v) => v.phase === 'play');
    await sleep(80);
    // B đứng yên ở góc (11,9) đặt bom dưới chân ⇒ tự nổ ⇒ A thắng (người cuối cùng còn sống)
    b.send({ t: 'bomb' });
    await a.wait((m) => m.t === 'f' && m.b.length === 1, 1000, 'thấy bom');
    b.send({ t: 'bomb' });
    assert.equal((await b.next((m) => m.t === 'err', 1000)).code, 'no-bomb', 'chỉ 1 quả lúc đầu');
    await a.wait((m) => m.t === 'f' && m.fl.length > 0, 2000, 'thấy lửa');
    const over = await a.state((v) => v.phase === 'over', 2000, 'hết ván');
    assert.equal(over.result.winner, 0); assert.equal(over.result.reason, 'last');
    assert.equal(over.players[0].wins, 1);
    assert.ok(a.msgs.some((m) => m.t === 'f' && m.over), 'khung cuối có cờ over');
    assert.ok(a.msgs.some((m) => m.t === 'f' && m.ev.some((e) => e.k === 'die' && e.i === 1)));
    // ván mới
    b.send({ t: 'again' });
    const g2 = await a.state((v) => v.phase === 'play' && v.gid === 2);
    assert.equal(g2.players[0].wins, 1, 'giữ số trận thắng');
    a.ws.close(); b.ws.close();
  } finally { await s.stop(); }
});

test('hết giờ: không ai chết, bằng điểm ⇒ hoà', async () => {
  const s = await startServer({ rules: { ...FAST, roundMs: 600 } });
  try {
    const { cs: [a, b, c] } = await room(s.url, 3);
    a.send({ t: 'start' });
    const over = await b.state((v) => v.phase === 'over', 3000);
    assert.equal(over.result.reason, 'time'); assert.equal(over.result.draw, true);
    // chủ phòng đưa cả phòng về phòng chờ để mời thêm người
    c.send({ t: 'lobby' });
    assert.equal((await c.next((m) => m.t === 'err')).code, 'not-host');
    a.send({ t: 'lobby' });
    await c.state((v) => v.phase === 'lobby' && v.result === null);
    a.ws.close(); b.ws.close(); c.ws.close();
  } finally { await s.stop(); }
});

test('phòng công khai: hiện trong danh sách, vào bằng danh sách, chủ phòng tắt thì biến mất', async () => {
  const s = await startServer();
  try {
    const { code, cs: [a] } = await room(s.url, 1, { public: true });
    const { cs: [z] } = await room(s.url, 1); // phòng riêng không hiện
    const v = await new Client(s.url, 'V').open();
    v.send({ t: 'list' });
    let ls = await v.wait((m) => m.t === 'list');
    assert.deepEqual(ls.rooms.map((r) => r.code), [code]);
    assert.equal(ls.rooms[0].host, 'An'); assert.equal(ls.rooms[0].n, 1);
    v.send({ t: 'join', code: ls.rooms[0].code, name: 'Khách' });
    await a.state((x) => x.players.length === 2 && x.public === true);
    a.send({ t: 'public', on: false });
    await a.state((x) => x.public === false);
    const w = await new Client(s.url, 'W').open();
    w.send({ t: 'list' });
    ls = await w.wait((m) => m.t === 'list');
    assert.equal(ls.rooms.length, 0);
    for (const x of [a, z, v, w]) x.ws.close();
  } finally { await s.stop(); }
});

test('rớt mạng giữa ván: vào lại bằng token, có ngay khung ván; rời hẳn giữa ván ⇒ bị loại, người kia thắng', async () => {
  const s = await startServer();
  try {
    const { code, cs: [a, b, c] } = await room(s.url, 3);
    a.send({ t: 'start' });
    await b.state((v) => v.phase === 'play');
    const tok = b.msgs.find((m) => m.t === 'joined').token;
    b.ws.close(); await b.closed;
    await a.state((v) => v.players[1]?.connected === false);
    const b2 = await new Client(s.url, 'B2').open();
    b2.send({ t: 'resume', code, token: tok });
    await b2.wait((m) => m.t === 'joined');
    await b2.wait((m) => m.t === 'f', 500, 'khung ngay khi vào lại');
    await a.state((v) => v.players[1]?.connected === true);
    // token bậy
    const x = await new Client(s.url, 'X').open();
    x.send({ t: 'resume', code, token: 'f'.repeat(32) });
    assert.equal((await x.wait((m) => m.t === 'err')).code, 'no-seat');
    // B2 và C rời hẳn ⇒ A thắng
    b2.send({ t: 'leave' }); await b2.wait((m) => m.t === 'left');
    c.send({ t: 'leave' });
    const over = await a.state((v) => v.phase === 'over', 2000);
    assert.equal(over.result.winner, 0);
    assert.equal(over.players[1].left, true);
    for (const k of [a, b2, c, x]) k.ws.close();
  } finally { await s.stop(); }
});

test('phòng chờ: rớt mạng quá 20 s (rút ngắn) thì mất ghế; quay lại kịp thì giữ ghế', async () => {
  const s = await startServer();
  try {
    const { code, cs: [a, b, c] } = await room(s.url, 3);
    const tb = b.msgs.find((m) => m.t === 'joined').token;
    b.ws.close(); c.ws.close();
    await sleep(100);
    const b2 = await new Client(s.url, 'B2').open();
    b2.send({ t: 'resume', code, token: tb });
    await b2.wait((m) => m.t === 'joined');
    await a.state((v) => v.players.length === 2 && v.players.every((p) => p.connected), 2000, 'C mất ghế, B còn');
    await sleep(300);
    assert.equal(a.v.players.length, 2, 'hẹn giờ cũ của B đã huỷ');
    a.ws.close(); b2.ws.close();
  } finally { await s.stop(); }
});

test('chống spam: gói vị trí dồn dập không làm rớt kết nối nhưng bị bỏ bớt; chat quá nhanh bị chặn', async () => {
  const s = await startServer();
  try {
    const { cs: [a, b] } = await room(s.url, 2);
    for (let k = 0; k < 8; k++) a.send({ t: 'chat', text: 'spam ' + k });
    await a.wait((m) => m.t === 'err' && m.code === 'chat-slow', 1000);
    a.send({ t: 'start' });
    await a.state((v) => v.phase === 'play');
    for (let k = 0; k < 35; k++) a.send({ t: 'mv', x: 1, y: 1, d: 'd' }); // trong ngân sách khung của ws (80)
    await sleep(300);
    assert.equal(a.ws.readyState, 1, 'vẫn kết nối ' + JSON.stringify(a.msgs.filter((m) => m.t === 'err')));
    // gửi bậy 200 khung liền ⇒ ws đóng 1008
    for (let k = 0; k < 200; k++) b.send({ t: 'ping' });
    assert.equal(await Promise.race([b.closed, sleep(2000).then(() => 'open')]), 1008);
    a.ws.close();
  } finally { await s.stop(); }
});
