// Test máy chủ phòng Cờ Tỷ Phú qua WebSocket THẬT (WebSocket có sẵn trong Node ≥ 22) + máy chủ thật trên cổng ngẫu nhiên.
// Chạy: node --test --test-concurrency=1 games-server/co-ty-phu/test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import * as L from '../../../prototype/games/co-ty-phu/logic.js';
const require = createRequire(import.meta.url);
const { createCoTyPhuHost } = require('../host.js');
const { Room, animMs } = require('../room.js');

const FAST = { turn: 400, away: 150, left: 30, anim: 0 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer(opts = {}) {
  const server = http.createServer((q, s) => s.end('x'));
  const host = createCoTyPhuHost(server, { timings: FAST, lobbyGraceMs: 200, logic: L, ...opts });
  await host.ready;
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `ws://127.0.0.1:${server.address().port}/ws/co-ty-phu`;
  return { url, host, server, stop: () => { host.close(); server.closeAllConnections?.(); return new Promise((r) => server.close(r)); } };
}

class Client {
  constructor(url, name) { this.url = url; this.name = name; this.raw = []; this.msgs = []; this.v = null; this.waiters = []; }
  async open() {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (e) => {
      this.raw.push(e.data);
      const m = JSON.parse(e.data); this.msgs.push(m);
      if (m.t === 'state') this.v = m.v;
      if (m.t === 'joined') { this.code = m.code; this.token = m.token; }
      for (const w of [...this.waiters]) if (w.f(m)) { this.waiters.splice(this.waiters.indexOf(w), 1); w.r(m); }
    };
    this.closed = new Promise((r) => (this.ws.onclose = r));
    await new Promise((r, j) => { this.ws.onopen = r; this.ws.onerror = j; });
    return this;
  }
  send(o) { this.ws.send(typeof o === 'string' ? o : JSON.stringify(o)); }
  next(f, ms = 4000) {
    if (this.v && f({ t: 'state', v: this.v })) return Promise.resolve({ t: 'state', v: this.v });
    return new Promise((r, j) => {
      const w = { f, r }; this.waiters.push(w);
      setTimeout(() => { const i = this.waiters.indexOf(w); if (i >= 0) { this.waiters.splice(i, 1); j(new Error(`${this.name}: hết giờ chờ — ${this.raw.slice(-2).map((t) => t.slice(0, 200)).join(' | ')}`)); } }, ms);
    });
  }
  async tryCmd(o, ms = 120) {
    const n = this.msgs.length; this.send(o); await sleep(ms);
    return this.msgs.slice(n).find((m) => m.t === 'err')?.code ?? null;
  }
  get myTurn() { const g = this.v?.game; return !!g && this.v.phase === 'play' && g.turn === this.v.you; }
  close() { this.ws.close(); }
}

async function table(url, n) {
  const cs = [];
  for (let i = 0; i < n; i++) cs.push(await new Client(url, `P${i}`).open());
  cs[0].send({ t: 'create', name: 'Chủ phòng' });
  await cs[0].next((m) => m.t === 'joined');
  for (let i = 1; i < n; i++) { cs[i].send({ t: 'join', code: cs[0].code.toLowerCase(), name: `Người ${i}` }); await cs[i].next((m) => m.t === 'joined'); }
  await sleep(40);
  return cs;
}

test('tạo phòng, vào bằng mã, đủ 4 người thì người thứ 5 bị từ chối, mã sai báo no-room', async () => {
  const S = await startServer();
  try {
    const cs = await table(S.url, 4);
    assert.match(cs[0].code, /^[A-HJ-NP-Z2-9]{5}$/);
    assert.deepEqual(cs[3].v.players.map((p) => p.name), ['Chủ phòng', 'Người 1', 'Người 2', 'Người 3']);
    assert.deepEqual(cs[3].v.players.map((p) => p.tok), [0, 1, 2, 3]);
    const x = await new Client(S.url, 'x').open();
    x.send({ t: 'join', code: cs[0].code, name: 'X' }); assert.equal((await x.next((m) => m.t === 'err')).code, 'full');
    x.send({ t: 'join', code: 'ZZZZZ', name: 'X' }); assert.equal((await x.next((m) => m.t === 'err' && m.code !== 'full')).code, 'no-room');
    for (const c of [...cs, x]) c.close();
  } finally { await S.stop(); }
});

test('phòng chờ: chỉ chủ phòng bắt đầu, cần ≥ 2 người; đổi linh vật không trùng; không vào thêm khi đã chơi', async () => {
  const S = await startServer({ timings: { ...FAST, turn: 60000 } });
  try {
    const [a] = await table(S.url, 1);
    assert.equal(await a.tryCmd({ t: 'start' }), 'need-2');
    const b = await new Client(S.url, 'b').open(); b.send({ t: 'join', code: a.code, name: 'B' }); await b.next((m) => m.t === 'joined');
    assert.equal(await b.tryCmd({ t: 'start' }), 'not-host');
    assert.equal(await b.tryCmd({ t: 'token', tok: 0 }), 'taken');
    assert.equal(await b.tryCmd({ t: 'token', tok: 9 }), 'bad');
    assert.equal(await b.tryCmd({ t: 'token', tok: 3 }), null);
    a.send({ t: 'start' }); await b.next((m) => m.t === 'state' && m.v.phase === 'play');
    assert.deepEqual(b.v.game.players.map((p) => [p.name, p.token, p.cash]), [['Chủ phòng', 0, 1200], ['B', 3, 1200]]);
    const c = await new Client(S.url, 'c').open(); c.send({ t: 'join', code: a.code, name: 'C' });
    assert.equal((await c.next((m) => m.t === 'err')).code, 'started');
    assert.equal(await b.tryCmd({ t: 'token', tok: 1 }), 'phase');
    a.close(); b.close(); c.close();
  } finally { await S.stop(); }
});

test('chỉ người có lượt được gieo / quyết; máy chủ gieo xúc xắc; góc nhìn không lộ rng, seed, bộ bài, token', async () => {
  const S = await startServer({ timings: { ...FAST, turn: 60000 } });
  try {
    const [a, b] = await table(S.url, 2);
    a.send({ t: 'start' }); await a.next((m) => m.t === 'state' && m.v.phase === 'play');
    assert.equal(await b.tryCmd({ t: 'roll' }), 'not-turn');
    assert.equal(await a.tryCmd({ t: 'decide', yes: true }), 'phase');
    a.send({ t: 'roll', dice: [6, 6] }); // client không chọn được mặt xúc xắc
    const st = await b.next((m) => m.t === 'state' && m.v.seq === 1);
    const roll = st.v.events.find((e) => e.type === 'roll');
    assert.ok(roll && roll.dice.every((d) => d >= 1 && d <= 6));
    for (const raw of [...a.raw, ...b.raw]) {
      assert.ok(!raw.includes(a.token) || raw.includes('"joined"'), 'lộ token');
      assert.ok(!raw.includes(b.token) || raw.includes('"joined"'), 'lộ token');
      assert.ok(!/"rng"|"seed"|"decks"|"ip"/.test(raw), 'lộ trạng thái ẩn: ' + raw.slice(0, 120));
    }
    a.close(); b.close();
  } finally { await S.stop(); }
});

test('cả ván chơi qua mạng tới hết: mua/bỏ qua, nộp phạt, máy chủ là nguồn sự thật, kết thúc và về phòng chờ', async () => {
  const S = await startServer({ timings: { ...FAST, turn: 60000 } });
  try {
    const cs = await table(S.url, 3);
    cs[0].send({ t: 'start' }); await cs[1].next((m) => m.t === 'state' && m.v.phase === 'play');
    let acts = 0, buys = 0, jails = 0;
    while (cs[0].v.phase === 'play' && acts < 3000) {
      const seq = cs[0].v.seq;
      const c = cs.find((x) => x.myTurn && x.v.seq === seq);
      if (!c) { await sleep(5); continue; }
      const gap = 210 - (Date.now() - (c.at || 0)); if (gap > 0) await sleep(gap); // tôn trọng giới hạn 5 lệnh/giây
      c.at = Date.now();
      const g = c.v.game, me = g.players[c.v.you];
      if (g.phase === 'roll' && me.jailed && me.cash >= 50 && acts % 2 === 0) { c.send({ t: 'jail' }); jails++; }
      else if (g.phase === 'roll') c.send({ t: 'roll' });
      else { const yes = me.cash - g.pending.cost > 100; if (yes) buys++; c.send({ t: 'decide', yes }); }
      acts++;
      await cs[0].next((m) => m.t === 'state' && m.v.seq > seq, 2000);
    }
    assert.equal(cs[0].v.phase, 'over', 'ván phải kết thúc');
    const g = cs[0].v.game;
    assert.ok(g.ranking && g.winner != null && ['rounds', 'lastStanding'].includes(g.endReason));
    assert.ok(buys > 0, 'phải có lần mua đất');
    const room = S.host.rooms.get(cs[0].code).room; // máy chủ là nguồn sự thật
    assert.deepEqual(g.players.map((p) => p.cash), room.g.players.map((p) => p.cash));
    assert.equal(await cs[2].tryCmd({ t: 'roll' }), 'phase');
    cs[2].send({ t: 'lobby' }); await cs[0].next((m) => m.t === 'state' && m.v.phase === 'lobby');
    assert.equal(cs[0].v.game, null);
    cs[0].send({ t: 'start' }); await cs[1].next((m) => m.t === 'state' && m.v.phase === 'play' && m.v.gid === 2);
    console.log(`  ván: ${acts} hành động, ${buys} lần mua, ${jails} lần nộp phạt, vòng ${g.round}, lý do ${g.endReason}`);
    for (const c of cs) c.close();
  } finally { await S.stop(); }
});

test('hết giờ: máy chủ tự gieo thay; người rời ván được chơi thay, ván vẫn chạy tới hết', async () => {
  const S = await startServer({ timings: { turn: 60, away: 40, left: 5, anim: 0 } });
  try {
    const [a, b] = await table(S.url, 2);
    a.send({ t: 'start' }); await b.next((m) => m.t === 'state' && m.v.phase === 'play');
    await b.next((m) => m.t === 'state' && m.v.seq >= 3, 3000); // không ai bấm gì → máy chủ vẫn đi
    b.send({ t: 'leave' }); await b.next((m) => m.t === 'left');
    await a.next((m) => m.t === 'state' && m.v.players[1].left);
    await a.next((m) => m.t === 'state' && m.v.phase === 'over', 30000);
    a.close(); b.close();
  } finally { await S.stop(); }
});

test('rớt mạng giữa ván: vào lại bằng token giữ ghế; hạn lượt không bị nới ra khi vào lại', async () => {
  let now = 0; const timers = [];
  const clock = { now: () => now, setTimeout: (f, ms) => { const t = { f, at: now + ms }; timers.push(t); return t; }, clearTimeout: (t) => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); } };
  const room = new Room({ code: 'AAAAA', L, clock, randInt: (n) => Math.floor(Math.random() * n), timings: { turn: 60000, away: 15000, left: 1000, anim: 0 } });
  room.join('A', 't'.repeat(32)); room.join('B', 'u'.repeat(32));
  room.handle(0, { t: 'start' });
  assert.equal(room.deadline, 60000);
  now = 1000; room.setConnected(0, false); assert.equal(room.deadline, 16000);
  now = 2000; room.setConnected(0, true); assert.equal(room.deadline, 16000);
  // hạn lượt kế tiếp chỉ tính sau khi client phát xong hoạt ảnh
  const room2 = new Room({ code: 'BBBBB', L, clock, randInt: () => 2, timings: { turn: 25000 } });
  room2.join('A', 'a'.repeat(32)); room2.join('B', 'b'.repeat(32)); room2.handle(0, { t: 'start' });
  now = 5000; room2.handle(0, { t: 'roll' });
  assert.equal(room2.deadline, 5000 + animMs(room2.events) + 25000);

  const S = await startServer({ timings: { ...FAST, turn: 60000, away: 60000 } });
  try {
    const [a, b] = await table(S.url, 2);
    a.send({ t: 'start' }); await b.next((m) => m.t === 'state' && m.v.phase === 'play');
    a.close(); await a.closed; await sleep(50);
    assert.equal(b.v.players[0].connected, false);
    const back = await new Client(S.url, 'back').open();
    back.send({ t: 'resume', code: a.code, token: a.token }); await back.next((m) => m.t === 'joined');
    await back.next((m) => m.t === 'state' && m.v.you === 0 && m.v.players[0].connected);
    assert.equal(await back.tryCmd({ t: 'roll' }), null);
    const bad = await new Client(S.url, 'bad').open();
    bad.send({ t: 'resume', code: a.code, token: 'f'.repeat(32) }); assert.equal((await bad.next((m) => m.t === 'err')).code, 'no-seat');
    back.close(); b.close(); bad.close();
  } finally { await S.stop(); }
});

test('dữ liệu rác không làm sập máy chủ, không để lại phòng mồ côi; chat do máy chủ gắn tên, lọc ký tự, chống spam', async () => {
  const S = await startServer();
  try {
    const x = await new Client(S.url, 'x').open();
    for (const junk of ['{', '[]', 'null', '"a"', JSON.stringify({ t: 'roll' }), JSON.stringify({ t: 'join', code: 5 })]) x.send(junk);
    for (let k = 0; k < 4; k++) {
      const c = await new Client(S.url, 'c' + k).open();
      c.send({ t: 'create', name: { toString: null } }); await c.next((m) => m.t === 'joined');
      c.send({ t: 'leave' }); await c.next((m) => m.t === 'left'); c.close();
    }
    assert.equal(S.host.rooms.size, 0, 'phòng tạo rồi rời phải được thu hồi');
    const [a, b] = await table(S.url, 2);
    a.send({ t: 'chat', text: '  xin‮chào  <b>cả nhà</b> ', name: 'Giả danh' });
    const st = await b.next((m) => m.t === 'state' && m.v.chat.length === 1);
    assert.equal(st.v.chat[0].name, 'Chủ phòng');
    assert.ok(!st.v.chat[0].text.includes('‮'));
    assert.equal(st.v.chat[0].mine, false);
    assert.equal(await a.tryCmd({ t: 'chat', text: 'x'.repeat(201) }), 'long');
    let slow = null; for (let k = 0; k < 8 && !slow; k++) slow = await a.tryCmd({ t: 'chat', text: 'spam ' + k }, 10);
    assert.equal(slow, 'chat-slow');
    a.send({ t: 'start' }); await b.next((m) => m.t === 'state' && m.v.phase === 'play');
    assert.equal(await a.tryCmd({ t: 'decide', yes: 'có' }), 'bad');
    assert.equal(await a.tryCmd({ t: 'nope' }), 'bad');
    x.close(); a.close(); b.close();
  } finally { await S.stop(); }
});
