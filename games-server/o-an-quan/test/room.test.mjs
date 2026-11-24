// Test máy chủ phòng Ô Ăn Quan qua WebSocket THẬT (WebSocket có sẵn trong Node ≥ 22) + máy chủ thật trên cổng ngẫu nhiên.
// Chạy: (thư mục games-server/o-an-quan) node --test   hoặc   node --test games-server/o-an-quan/test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import * as L from '../../../prototype/games/o-an-quan/logic.js';
import * as A from '../../../prototype/games/o-an-quan/ai.js';
const require = createRequire(import.meta.url);
const { createOAnQuanHost } = require('../host.js');
const { Room } = require('../room.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer(opts = {}) {
  const server = http.createServer((q, s) => s.end('x'));
  const host = createOAnQuanHost(server, { timings: { turn: 60000, away: 60000 }, lobbyGraceMs: 200, ...opts });
  await host.ready;
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `ws://127.0.0.1:${server.address().port}/ws/o-an-quan`;
  return { url, host, stop: () => { host.close(); server.closeAllConnections?.(); return new Promise((r) => server.close(r)); } };
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
    await new Promise((r, j) => { this.ws.onopen = r; this.ws.onerror = j; });
    return this;
  }
  send(o) { this.ws.send(typeof o === 'string' ? o : JSON.stringify(o)); }
  next(f, ms = 3000) {
    if (this.v && f({ t: 'state', v: this.v })) return Promise.resolve({ t: 'state', v: this.v });
    return new Promise((r, j) => {
      const w = { f, r }; this.waiters.push(w);
      setTimeout(() => { const i = this.waiters.indexOf(w); if (i >= 0) { this.waiters.splice(i, 1); j(new Error(`${this.name}: hết giờ chờ — đã nhận: ${this.raw.slice(-2).map((t) => t.slice(0, 200)).join(' | ')}`)); } }, ms);
    });
  }
  async tryCmd(o, ms = 120) {
    const n = this.msgs.length; this.send(o); await sleep(ms);
    return this.msgs.slice(n).find((m) => m.t === 'err')?.code ?? null;
  }
  close() { this.ws.close(); }
}
const st = (f) => (m) => m.t === 'state' && f(m.v);

async function room(url, n, create = {}) {
  const cs = [];
  for (let i = 0; i < n; i++) cs.push(await new Client(url, 'P' + i).open());
  cs[0].send({ t: 'create', name: 'An', size: n, ...create }); await cs[0].next((m) => m.t === 'joined');
  for (let i = 1; i < n; i++) { cs[i].send({ t: 'join', code: cs[0].code.toLowerCase(), name: ['', 'Bình', 'Cúc', 'Dũng'][i] }); await cs[i].next((m) => m.t === 'joined'); }
  await cs[0].next(st((v) => v.players.length === n));
  return cs;
}
async function started(url, n = 2, create) {
  const cs = await room(url, n, create);
  cs[0].send({ t: 'start' });
  for (const c of cs) await c.next(st((v) => v.phase === 'play'));
  return cs;
}
// người có lượt đi một nước hợp lệ (máy Dễ chọn), chờ mọi người thấy seq tăng
async function mv(cs, pick) {
  const v = cs[0].v, who = cs[v.seat];
  const s = fromView(who.v);
  const m = pick ? pick(s) : L.legalMoves(s)[0];
  who.send({ t: 'move', pit: m[0], dir: m[1] });
  for (const c of cs) await c.next(st((x) => x.seq > v.seq || x.gid !== v.gid));
  return m;
}
// dựng lại ván bằng logic.js từ danh sách nước máy chủ gửi
function fromView(v) {
  const G = v.game;
  return L.replay(L.newMatch({ quanNon: G.quanNon, first: G.first }), G.moves);
}

test('tạo phòng 1v1 (luật chủ phòng chọn) + vào bằng mã không phân biệt hoa thường; người thứ 3 bị từ chối; mã sai báo no-room', async () => {
  const S = await startServer();
  try {
    const [a, b] = await room(S.url, 2, { rule: 'quan-non' });
    assert.equal(a.v.max, 2); assert.equal(a.v.rule, 'quan-non'); assert.equal(b.v.you, 1);
    assert.deepEqual(b.v.players.map((p) => p.name), ['An', 'Bình']);
    const c = await new Client(S.url, 'C').open();
    assert.equal(await c.tryCmd({ t: 'join', code: a.code, name: 'Cúc' }), 'full');
    const d = await new Client(S.url, 'D').open();
    assert.equal(await d.tryCmd({ t: 'join', code: 'ZZZZZ', name: 'Dũng' }), 'no-room');
    assert.equal(await b.tryCmd({ t: 'start' }), 'not-host');
    assert.equal(await b.tryCmd({ t: 'rule', rule: 'thuong' }), 'not-host');
    assert.equal(await a.tryCmd({ t: 'rule', rule: 'gi-do' }), 'bad');
    a.send({ t: 'rule', rule: 'thuong' }); await b.next(st((v) => v.rule === 'thuong'));
    a.send({ t: 'start' }); await b.next(st((v) => v.phase === 'play'));
    assert.equal(b.v.game.quanNon, false);
    assert.equal(await a.tryCmd({ t: 'rule', rule: 'quan-non' }), 'phase');
    const e = await new Client(S.url, 'E').open();
    assert.equal(await e.tryCmd({ t: 'join', code: a.code, name: 'Én' }), 'started');
  } finally { await S.stop(); }
});

test('danh sách phòng công khai đúng sức chứa (2 và 4); phòng kín / đủ người không hiện', async () => {
  const S = await startServer();
  try {
    const a = await new Client(S.url, 'A').open();
    a.send({ t: 'create', name: 'An', size: 4 }); await a.next((m) => m.t === 'joined');
    const b = await new Client(S.url, 'B').open();
    b.send({ t: 'create', name: 'Bình', size: 2 }); await b.next((m) => m.t === 'joined');
    const k = await new Client(S.url, 'K').open();
    k.send({ t: 'create', name: 'Kín', size: 2, public: false }); await k.next((m) => m.t === 'joined');
    await sleep(50);
    const list = S.host.publicList().sort((x, y) => x.max - y.max);
    assert.deepEqual(list.map((r) => [r.host, r.n, r.max]), [['Bình', 1, 2], ['An', 1, 4]]);
    const c = await new Client(S.url, 'C').open();
    c.send({ t: 'join', code: b.code, name: 'Cúc' }); await c.next((m) => m.t === 'joined'); await sleep(50);
    assert.deepEqual(S.host.publicList().map((r) => r.max), [4]);
  } finally { await S.stop(); }
});

test('2v2: đủ 4 người mới bắt đầu; lượt A1 → B1 → A2 → B2; đội = ghế % 2; sai lượt / nước sai bị từ chối', async () => {
  const S = await startServer();
  try {
    const cs = await room(S.url, 3, { size: 4 });
    assert.equal(cs[0].v.max, 4);
    assert.equal(await cs[0].tryCmd({ t: 'start' }), 'need-all');
    const d = await new Client(S.url, 'P3').open();
    d.send({ t: 'join', code: cs[0].code, name: 'Dũng' }); await d.next((m) => m.t === 'joined');
    cs.push(d);
    await cs[0].next(st((v) => v.players.length === 4));
    cs[0].send({ t: 'start' });
    for (const c of cs) await c.next(st((v) => v.phase === 'play'));
    const order = [];
    for (let k = 0; k < 6; k++) {
      const v = cs[0].v;
      order.push(v.seat);
      assert.equal(v.game.turn, v.seat % 2, 'đội tới lượt = ghế % 2');
      const wrong = cs[(v.seat + 1) % 4];
      assert.equal(await wrong.tryCmd({ t: 'move', pit: v.seat % 2 ? 7 : 1, dir: 1 }), 'not-turn');
      const me = cs[v.seat];
      const otherRow = v.seat % 2 ? 1 : 7;
      assert.equal(await me.tryCmd({ t: 'move', pit: otherRow, dir: 1 }), 'illegal');
      assert.equal(await me.tryCmd({ t: 'move', pit: 1.5, dir: 1 }), 'bad');
      assert.equal(await me.tryCmd({ t: 'move', pit: 3, dir: 0 }), 'bad');
      await mv(cs);
      if (cs[0].v.phase !== 'play') break;
    }
    assert.deepEqual(order.slice(0, 4), [0, 1, 2, 3]);
    if (order.length > 4) assert.equal(order[4], 0);
  } finally { await S.stop(); }
});

test('trạng thái không lộ token; mọi máy nhận cùng ván; dựng lại bằng logic.js từ danh sách nước ra đúng bàn', async () => {
  const S = await startServer();
  try {
    const [a, b] = await started(S.url);
    for (let k = 0; k < 6 && a.v.phase === 'play'; k++) await mv([a, b], (s) => A.bestMove(s, 'easy'));
    assert.deepEqual(a.v.game, b.v.game);
    const s = fromView(a.v);
    assert.deepEqual(s.pits, a.v.game.pits); assert.deepEqual(s.score, a.v.game.score); assert.deepEqual(s.quan, a.v.game.quan);
    assert.equal(L.total(s), 70);
    for (const raw of [...a.raw, ...b.raw].filter((t) => !t.startsWith('{"t":"joined"'))) assert.ok(!raw.includes(a.token) && !raw.includes(b.token));
  } finally { await S.stop(); }
});

test('chơi hết ván → kết quả; "again": đội thua đi trước, tỉ số giữ qua ván', async () => {
  const S = await startServer();
  try {
    const [a, b] = await started(S.url);
    while (a.v.phase === 'play') { await mv([a, b], (s) => A.bestMove(s, 'medium')); await sleep(90); } // dưới hạn mức 5 lệnh/giây
    assert.equal(a.v.phase, 'over');
    const g = a.v.game;
    assert.ok([0, 1, 2].includes(g.winner)); assert.ok(g.final);
    assert.equal(g.tally.reduce((x, y) => x + y, 0), 1);
    await sleep(400);
    assert.equal(await a.tryCmd({ t: 'move', pit: 1, dir: 1 }), 'phase');
    b.send({ t: 'again' });
    await a.next(st((v) => v.phase === 'play' && v.game.round === 2));
    const loser = g.winner === 0 ? 1 : g.winner === 1 ? 0 : 1;
    assert.equal(a.v.seat % 2, loser); assert.equal(a.v.game.turn, loser);
    assert.deepEqual(a.v.game.tally, g.tally);
  } finally { await S.stop(); }
});

test('người có lượt im lặng quá hạn → máy chủ đi thay bằng nước hợp lệ; mất kết nối → đi thay sớm hơn', async () => {
  const S = await startServer({ timings: { turn: 300, away: 80 } });
  try {
    const [a, b] = await started(S.url);
    assert.ok(a.v.deadline > 0);
    await b.next(st((v) => v.seq >= 1), 2000);
    assert.ok(b.v.act.auto, 'đánh dấu là máy đi thay'); assert.equal(b.v.act.seat, 0);
    assert.ok(fromView(b.v), 'nước đi thay hợp lệ theo logic.js');
    if (b.v.phase !== 'play') return;
    b.close(); const t0 = Date.now();
    await a.next(st((v) => v.seq >= 2), 2000);
    assert.ok(Date.now() - t0 < 280, 'đi thay sớm vì mất kết nối');
    assert.equal(a.v.players[1].connected, false);
  } finally { await S.stop(); }
});

test('rớt mạng giữa ván: giữ ghế, quay lại bằng token; token sai bị từ chối; tab cũ bị thay', async () => {
  const S = await startServer();
  try {
    const [a, b] = await started(S.url);
    await mv([a, b]);
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
    if (a.v.phase === 'play') { await mv([a, b3]); assert.equal(a.v.game.moves.length, 2); }
  } finally { await S.stop(); }
});

test('một người rời giữa ván → về phòng chờ, báo đã rời; chủ phòng hủy phòng → mọi người nhận "closed"', async () => {
  const S = await startServer();
  try {
    const [a, b] = await started(S.url);
    b.send({ t: 'leave' }); await b.next((m) => m.t === 'left');
    await a.next(st((v) => v.phase === 'lobby' && v.oppLeft && v.players.length === 1));
    const c = await new Client(S.url, 'C').open();
    c.send({ t: 'join', code: a.code, name: 'Cúc' }); await c.next((m) => m.t === 'joined');
    await a.next(st((v) => v.players.length === 2));
    assert.equal(await c.tryCmd({ t: 'disband' }), 'not-host');
    const closedA = a.next((m) => m.t === 'closed'), closedC = c.next((m) => m.t === 'closed');
    a.send({ t: 'disband' });
    await closedA; await closedC;
    assert.equal(S.host.rooms.size, 0);
  } finally { await S.stop(); }
});

test('chat: đi qua máy chủ, tên người gửi do máy chủ gắn, làm sạch, giới hạn độ dài + số tin; không đổi ván', async () => {
  const S = await startServer();
  try {
    const cs = await started(S.url, 4, { size: 4 });
    const seq = cs[0].v.seq;
    cs[2].send({ t: 'chat', text: '  Chào\u0007  cả nhà <3 ', name: 'Giả', from: 0 });
    for (const c of cs) await c.next(st((v) => v.chat.length === 1));
    assert.equal(cs[0].v.chat[0].name, 'Cúc'); assert.equal(cs[0].v.chat[0].text, 'Chào cả nhà <3');
    assert.equal(cs[2].v.chat[0].mine, true); assert.equal(cs[1].v.chat[0].mine, false);
    assert.equal(cs[0].v.seq, seq);
    assert.equal(await cs[1].tryCmd({ t: 'chat', text: '   ' }), 'bad');
    assert.equal(await cs[1].tryCmd({ t: 'chat', text: 'x'.repeat(201) }), 'long');
    const errs = [];
    for (let k = 0; k < 6; k++) errs.push(await cs[1].tryCmd({ t: 'chat', text: 'spam ' + k }, 20));
    assert.deepEqual(errs.slice(0, 4), [null, null, null, null]); assert.equal(errs[4], 'chat-slow');
  } finally { await S.stop(); }
});

test('hẹn giờ (đồng hồ giả): người không có lượt ngắt/nối không kéo dài hạn; người có lượt mất kết nối chỉ làm hạn ngắn lại', () => {
  let t = 1000; const timers = [];
  const clock = { now: () => t, setTimeout: (f, ms) => { const h = { f, at: t + ms }; timers.push(h); return h; }, clearTimeout: (h) => { const i = timers.indexOf(h); if (i >= 0) timers.splice(i, 1); } };
  const r = new Room({ code: 'AAAAA', L, A, clock, size: 2, rule: 'thuong' });
  r.join('An', 'a'.repeat(32)); r.join('Bình', 'b'.repeat(32));
  assert.deepEqual(r.handle(0, { t: 'start' }), { ok: true });
  assert.equal(r.deadline, 1000 + 60000);
  t += 10000; r.setConnected(1, false); r.setConnected(1, true);
  assert.equal(r.deadline, 61000, 'người không có lượt không đổi hạn');
  r.setConnected(0, false);
  assert.equal(r.deadline, 11000 + 15000, 'người có lượt mất kết nối → còn 15 s');
  r.setConnected(0, true);
  assert.equal(r.deadline, 61000, 'nối lại không dài hơn hạn gốc');
  t = 61000; timers.sort((x, y) => x.at - y.at).shift().f();
  assert.equal(r.seq, 1); assert.equal(r.lastAct.auto, true); assert.equal(r.seat, 1);
});

test('server.js gắn Ô Ăn Quan ở /ws/o-an-quan', async () => {
  const server = require('../../../server.js');
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const c = await new Client(`ws://127.0.0.1:${server.address().port}/ws/o-an-quan`, 'S').open();
    let code = null;
    for (let k = 0; k < 20 && !code; k++) {
      const n = c.msgs.length; c.send({ t: 'create', name: 'An', size: 4 }); await sleep(150);
      code = c.msgs.slice(n).find((m) => m.t === 'joined')?.code;
    }
    assert.ok(code);
    c.close();
  } finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
});
