// Test máy chủ phòng Cờ Vua qua WebSocket THẬT (WebSocket có sẵn trong Node ≥ 22) + máy chủ thật trên cổng ngẫu nhiên.
// Chạy: node --test --test-concurrency=1 games-server/co-vua/test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import * as L from '../../../prototype/games/co-vua/logic.js';
import * as A from '../../../prototype/games/co-vua/ai.js';
const require = createRequire(import.meta.url);
const { createCoVuaHost } = require('../host.js');
const { Room } = require('../room.js');

const FAST = { turn: 400, away: 150 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer(opts = {}) {
  const server = http.createServer((q, s) => s.end('x'));
  const host = createCoVuaHost(server, { timings: FAST, lobbyGraceMs: 200, ...opts });
  await host.ready;
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `ws://127.0.0.1:${server.address().port}/ws/co-vua`;
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
const sq = (n) => (8 - +n[1]) * 8 + L.FILES.indexOf(n[0]);
// đi nước "e2-e4" (hoặc "a7-a8=q") bởi client c rồi chờ cả hai thấy seq tăng
async function mv(c, both, txt) {
  const [a, b, promo] = txt.split(/[-=]/), seq = c.v.seq, gid = c.v.gid;
  c.send({ t: 'move', from: sq(a), to: sq(b), ...(promo ? { promo } : {}) });
  for (const x of both) await x.next(st((v) => v.seq > seq || v.gid !== gid || v.phase === 'over'));
}
const fakeClock = () => {
  const c = { now: 0, timers: [] };
  c.clock = { now: () => c.now, setTimeout: (f, ms) => { const t = { at: c.now + ms, f }; c.timers.push(t); return t; }, clearTimeout: (t) => { c.timers = c.timers.filter((x) => x !== t); } };
  c.tick = (to) => { for (;;) { const t = c.timers.filter((x) => x.at <= to).sort((p, q) => p.at - q.at)[0]; if (!t) break; c.timers = c.timers.filter((x) => x !== t); c.now = t.at; t.f(); } c.now = to; };
  return c;
};

test('tạo phòng + vào bằng mã không phân biệt hoa thường; người thứ 3 bị từ chối; mã sai báo no-room', async () => {
  const S = await startServer();
  try {
    const [a, b] = await pair(S.url);
    assert.deepEqual(a.v.players.map((p) => p.name), ['An', 'Bình']);
    assert.equal(a.v.you, 0); assert.equal(b.v.you, 1); assert.equal(b.v.host, 0); assert.equal(a.v.game, null);
    const c = await new Client(S.url, 'C').open();
    assert.equal(await c.tryCmd({ t: 'join', code: a.code, name: 'x' }), 'full');
    assert.equal(await c.tryCmd({ t: 'join', code: 'ZZZZ2', name: 'x' }), 'no-room');
    for (const x of [a, b, c]) x.close();
  } finally { await S.stop(); }
});

test('chỉ chủ phòng bắt đầu; cần đủ 2 người; chủ phòng cầm Trắng ván 1; bắt đầu rồi thì không vào thêm được', async () => {
  const S = await startServer();
  try {
    const a = await new Client(S.url, 'A').open();
    a.send({ t: 'create', name: 'An' }); await a.next((m) => m.t === 'joined');
    assert.equal(await a.tryCmd({ t: 'start' }), 'need-2');
    const b = await new Client(S.url, 'B').open();
    b.send({ t: 'join', code: a.code, name: 'Bình' }); await b.next((m) => m.t === 'joined');
    assert.equal(await b.tryCmd({ t: 'start' }), 'not-host');
    a.send({ t: 'start' }); await b.next(st((v) => v.phase === 'play'));
    assert.equal(b.v.game.white, 0); assert.equal(b.v.game.turn, 'w');
    const c = await new Client(S.url, 'C').open();
    assert.equal(await c.tryCmd({ t: 'join', code: a.code, name: 'x' }), 'started');
    for (const x of [a, b, c]) x.close();
  } finally { await S.stop(); }
});

test('xác thực nước đi: sai lượt, đi quân đối phương, nước sai luật, quân bị ghim, phong cấp sai, kiểu dữ liệu lạ đều bị từ chối', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    assert.equal(await b.tryCmd({ t: 'move', from: sq('e7'), to: sq('e5') }), 'not-turn');
    assert.equal(await a.tryCmd({ t: 'move', from: sq('e7'), to: sq('e5') }), 'illegal', 'Trắng không đi quân Đen');
    assert.equal(await a.tryCmd({ t: 'move', from: sq('e2'), to: sq('e5') }), 'illegal', 'Tốt không đi 3 ô');
    assert.equal(await a.tryCmd({ t: 'move', from: sq('d1'), to: sq('d7') }), 'illegal', 'Hậu không nhảy qua quân');
    assert.equal(await a.tryCmd({ t: 'move', from: sq('e1'), to: sq('g1') }), 'illegal', 'không nhập thành khi còn quân chắn');
    assert.equal(await a.tryCmd({ t: 'move', from: sq('e2'), to: sq('e4'), promo: 'q' }), 'illegal', 'không phong cấp giữa bàn');
    assert.equal(await a.tryCmd({ t: 'move', from: sq('e2'), to: sq('e4'), promo: 'k' }), 'bad');
    assert.equal(await a.tryCmd({ t: 'move', from: '52', to: 36 }), 'bad');
    assert.equal(await a.tryCmd({ t: 'move', from: 52.5, to: 36 }), 'bad');
    assert.equal(await a.tryCmd({ t: 'move', from: 52, to: 64 }), 'illegal');
    assert.equal(await a.tryCmd({ t: 'move', from: -1, to: 36 }), 'illegal');
    assert.equal(await a.tryCmd({ t: 'move' }), 'bad');
    assert.equal(await a.tryCmd({ t: 'again' }), 'phase', 'không xin ván mới giữa ván');
    assert.equal(await a.tryCmd({ t: 'undo' }), 'bad', 'không có đi lại khi chơi online');
    await mv(a, [a, b], 'e2-e4');
    assert.equal(await a.tryCmd({ t: 'move', from: sq('d2'), to: sq('d4') }), 'not-turn', 'không đi 2 nước liền');
    await mv(b, [a, b], 'd7-d6');
    await mv(a, [a, b], 'f1-b5');
    // Đen đang bị chiếu (Tượng b5 → Vua e8): nước không đỡ chiếu bị từ chối
    assert.equal(await b.tryCmd({ t: 'move', from: sq('a7'), to: sq('a6') }), 'illegal', 'đang bị chiếu phải đỡ');
    // client gửi kèm bàn/kết quả giả → máy chủ bỏ qua
    b.send({ t: 'move', from: sq('c7'), to: sq('c6'), board: [], result: { winner: 'b' }, turn: 'b' });
    await a.next(st((v) => v.seq === 4));
    assert.equal(a.v.game.result, null); assert.equal(a.v.game.turn, 'w');
    assert.deepEqual(a.v.game.moves.at(-1), [sq('c7'), sq('c6')]);
    for (const x of [a, b]) x.close();
  } finally { await S.stop(); }
});

test('chiếu bí: không lộ token; 2 máy cùng một ván; dựng lại bằng logic.js đúng kết quả; ván sau đổi màu, giữ tỉ số', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    await mv(a, [a, b], 'f2-f3'); await mv(b, [a, b], 'e7-e5'); await mv(a, [a, b], 'g2-g4'); await mv(b, [a, b], 'd8-h4');
    await a.next(st((v) => v.phase === 'over')); await b.next(st((v) => v.phase === 'over'));
    for (const raw of [...a.raw, ...b.raw].filter((t) => !t.startsWith('{"t":"joined"'))) assert.ok(!raw.includes(a.token) && !raw.includes(b.token), 'không lộ token');
    assert.deepEqual(a.v.game, b.v.game);
    const G = a.v.game;
    assert.deepEqual(G.result, { winner: 'b', reason: 'mate' }); assert.deepEqual(G.score, [0, 1]);
    const s = L.replay(L.newMatch(), G.moves.map(([from, to, promo]) => ({ from, to, promo })));
    assert.deepEqual(s.result, G.result);
    assert.equal(await a.tryCmd({ t: 'move', from: sq('a2'), to: sq('a3') }), 'phase');
    const seqs = b.states.filter((v) => v.phase !== 'lobby').map((v) => v.seq);
    for (let i = 1; i < seqs.length; i++) assert.ok(seqs[i] - seqs[i - 1] <= 1, 'seq không nhảy cóc: ' + seqs.join(','));
    b.send({ t: 'again' }); await a.next(st((v) => v.phase === 'play' && v.game.round === 2));
    assert.equal(a.v.game.white, 1, 'ván 2 Bình cầm Trắng'); assert.deepEqual(a.v.game.score, [0, 1]); assert.equal(a.v.game.moves.length, 0);
    assert.equal(await a.tryCmd({ t: 'move', from: sq('e7'), to: sq('e5') }), 'not-turn');
    await mv(b, [a, b], 'e2-e4');
    for (const x of [a, b]) x.close();
  } finally { await S.stop(); }
});

test('phong cấp qua mạng: chọn Mã được giữ đúng; xin thua cộng điểm cho đối thủ', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    for (const [c, m] of [[a, 'h2-h4'], [b, 'g7-g5'], [a, 'h4-g5'], [b, 'a7-a6'], [a, 'g5-g6'], [b, 'a6-a5'], [a, 'g6-h7'], [b, 'a5-a4']]) await mv(c, [a, b], m);
    assert.equal(await a.tryCmd({ t: 'move', from: sq('h7'), to: sq('g8') }), 'illegal', 'thiếu quân phong cấp');
    await mv(a, [a, b], 'h7-g8=n');
    assert.deepEqual(b.v.game.moves.at(-1), [sq('h7'), sq('g8'), 'n']);
    b.send({ t: 'resign' }); await a.next(st((v) => v.phase === 'over'));
    assert.deepEqual(a.v.game.result, { winner: 'w', reason: 'resign' }); assert.deepEqual(a.v.game.score, [1, 0]);
    assert.equal(await b.tryCmd({ t: 'resign' }), 'phase');
    for (const x of [a, b]) x.close();
  } finally { await S.stop(); }
});

test('đề nghị hòa: đối thủ đồng ý → hòa; từ chối; mỗi nước chỉ đề nghị 1 lần; đi nước là hủy lời mời', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    a.send({ t: 'draw' }); await b.next(st((v) => v.drawOffer === 0));
    b.send({ t: 'draw-no' }); await a.next(st((v) => v.drawOffer === -1));
    assert.equal(a.v.canOffer, false);
    assert.equal(await a.tryCmd({ t: 'draw' }), 'draw-wait', 'không spam lời mời hòa');
    b.send({ t: 'draw' }); await a.next(st((v) => v.drawOffer === 1));
    await mv(a, [a, b], 'e2-e4');
    assert.equal(a.v.drawOffer, -1, 'đi nước = không nhận lời');
    a.send({ t: 'draw' }); await b.next(st((v) => v.drawOffer === 0));
    b.send({ t: 'draw' }); await a.next(st((v) => v.phase === 'over'));
    assert.deepEqual(a.v.game.result, { winner: null, reason: 'agreed' }); assert.equal(a.v.game.draws, 1);
    for (const x of [a, b]) x.close();
  } finally { await S.stop(); }
});

test('người có lượt im lặng quá hạn → máy chủ đi thay bằng nước hợp lệ; mất kết nối → đi thay sớm hơn', async () => {
  const S = await startServer({ timings: { turn: 250, away: 80 } });
  try {
    const [a, b] = await started(S.url);
    await b.next(st((v) => v.seq >= 1), 1500);
    assert.ok(b.v.act.auto, 'đánh dấu là máy đi thay');
    assert.ok(L.replay(L.newMatch(), b.v.game.moves.map(([from, to, promo]) => ({ from, to, promo }))), 'nước hợp lệ');
    b.close(); const t0 = Date.now();
    await a.next(st((v) => v.seq >= 2), 1500);
    assert.ok(Date.now() - t0 < 230, 'đi thay sớm vì mất kết nối');
    assert.equal(a.v.players[1].connected, false);
    a.close();
  } finally { await S.stop(); }
});

test('rớt mạng giữa ván: giữ ghế, quay lại bằng token; token sai bị từ chối; tab cũ bị thay', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    await mv(a, [a, b], 'e2-e4');
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
    await mv(b3, [a, b3], 'e7-e5');
    assert.deepEqual(a.v.game.moves.at(-1), [sq('e7'), sq('e5')]);
    for (const x of [a, b3, bad]) x.close();
  } finally { await S.stop(); }
});

test('một người rời giữa trận → về phòng chờ, người còn lại làm chủ; người mới vào chơi tiếp được', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    await mv(a, [a, b], 'e2-e4');
    a.send({ t: 'leave' }); await a.next((m) => m.t === 'left');
    await b.next(st((v) => v.phase === 'lobby' && v.players.length === 1));
    assert.equal(b.v.you, 0); assert.equal(b.v.host, 0); assert.equal(b.v.oppLeft, true); assert.equal(b.v.game, null);
    const c = await new Client(S.url, 'C').open();
    c.send({ t: 'join', code: b.code, name: 'Chi' }); await c.next((m) => m.t === 'joined');
    b.send({ t: 'start' }); await c.next(st((v) => v.phase === 'play'));
    assert.equal(c.v.oppLeft, false); assert.equal(c.v.game.moves.length, 0); assert.deepEqual(c.v.game.score, [0, 0]);
    assert.equal(await a.tryCmd({ t: 'move', from: 52, to: 36 }), 'no-room');
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
    assert.equal(await a.tryCmd({ t: 'move', from: 52, to: 36 }), 'no-room');
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

test('tên không phải chuỗi (toString:null…) không làm hỏng máy chủ, không để lại phòng mồ côi', async () => {
  const S = await startServer();
  try {
    const c = await new Client(S.url, 'c').open();
    for (const name of [{ toString: null }, ['x'], 42, null]) {
      const d = await new Client(S.url, 'd').open();
      d.send({ t: 'create', name }); const j = await d.next((m) => m.t === 'joined' || m.t === 'err');
      assert.equal(j.t, 'joined'); await d.next(st((v) => v.players?.length === 1));
      assert.equal(d.v.players[0].name, 'Người 1');
      d.send({ t: 'leave' }); await d.next((m) => m.t === 'left'); d.close();
    }
    const r = new Room({ code: 'ABCDE', L, A, clock: fakeClock().clock });
    assert.ok(r.join({ toString: null }, 't1').ok !== false); r.close();
    c.send({ t: 'create', name: 'ok' }); assert.equal((await c.next((m) => m.t === 'joined' || m.t === 'err')).t, 'joined');
    assert.equal(S.host.rooms?.size ?? 1, 1);
    c.close();
  } finally { await S.stop(); }
});

test('người có lượt rớt mạng (hạn rút còn 15 s) rồi vào lại: hạn KHÔNG nới về 60 s (đồng hồ giả)', () => {
  const F = fakeClock();
  const r = new Room({ code: 'ABCDE', L, A, clock: F.clock, timings: { turn: 60000, away: 15000 } });
  r.join('A', 'ta'); r.join('B', 'tb'); r.handle(0, { t: 'start' });
  F.tick(1000); r.setConnected(0, false);
  assert.equal(r.deadline, 16000);
  F.tick(2000); r.setConnected(0, true);
  assert.equal(r.deadline, 16000, 'vào lại không được kéo dài hạn');
  F.tick(16001); assert.equal(r.seq, 1, 'máy chủ đi thay đúng hạn đã rút');
  r.close();
});

test('người không có lượt ngắt/nối liên tục không kéo dài được hạn; người có lượt mất kết nối chỉ làm hạn ngắn lại (đồng hồ giả)', () => {
  const F = fakeClock();
  const r = new Room({ code: 'ABCDE', L, A, clock: F.clock, timings: { turn: 60000, away: 15000 } });
  r.join('A', 'ta'); r.join('B', 'tb'); r.handle(0, { t: 'start' });
  assert.equal(r.deadline, 60000);
  for (let t = 59000; t < 59900; t += 100) { F.tick(t); r.setConnected(1, false); r.setConnected(1, true); }
  assert.equal(r.deadline, 60000, 'hạn không bị đẩy lùi');
  F.tick(60001); assert.equal(r.seq, 1, 'máy chủ đi thay đúng hạn');
  const base = r.deadline;
  F.tick(F.now + 50000); r.setConnected(1, false);
  assert.equal(r.deadline, base, 'mất kết nối gần hết hạn không làm hạn dài thêm');
  r.setConnected(1, true); assert.equal(r.deadline, base);
  r.close();
});

test('cả ván máy chủ tự đi thay đến hết: luôn hợp lệ, kết thúc có kết quả (đồng hồ giả)', () => {
  const F = fakeClock();
  const r = new Room({ code: 'ABCDE', L, A, clock: F.clock, timings: { turn: 10, away: 10 } });
  r.join('A', 'ta'); r.join('B', 'tb'); r.handle(0, { t: 'start' });
  for (let k = 0; k < 700 && r.phase === 'play'; k++) F.tick(F.now + 10);
  assert.equal(r.phase, 'over'); assert.ok(r.s.result);
  r.close();
});

test('server.js gắn Cờ Vua mặc định, tắt được bằng COVUA_ONLINE=0', async () => {
  const { execFileSync } = await import('node:child_process');
  const probe = (env) => execFileSync(process.execPath, ['-e', `
    const s=require('./server.js'); s.listen(0,'127.0.0.1',async()=>{const p=s.address().port;
      const ws=new WebSocket('ws://127.0.0.1:'+p+'/ws/co-vua');
      const t=setTimeout(()=>{console.log('off');process.exit(0)},800);
      ws.onopen=()=>{clearTimeout(t);console.log('on');process.exit(0)}; ws.onerror=()=>{clearTimeout(t);console.log('off');process.exit(0)};});`],
    { cwd: new URL('../../../', import.meta.url), env: { ...process.env, MASOI_ONLINE: '0', NOITU_ONLINE: '0', ...env }, encoding: 'utf8' }).trim().split('\n').pop();
  assert.equal(probe({ COVUA_ONLINE: '1' }), 'on');
  assert.equal(probe({ COVUA_ONLINE: '' }), 'on');
  assert.equal(probe({ COVUA_ONLINE: '0' }), 'off');
});

test('chat: đi qua máy chủ; tên người gửi do máy chủ gắn; làm sạch; giới hạn độ dài + số tin; không đổi ván; người ngoài không chat được', async () => {
  const S = await startServer();
  try {
    const [a, b] = await started(S.url);
    const seq = a.v.seq;
    a.send({ t: 'chat', text: '  Chào‮\u0007  bạn <3  ', name: 'Bình', from: 1, mine: false, id: 999 });
    await b.next(st((v) => v.chat.length === 1));
    const [m] = b.v.chat;
    assert.equal(m.name, 'An'); assert.equal(m.text, 'Chào bạn <3'); assert.equal(m.mine, false);
    await a.next(st((v) => v.chat.length === 1)); assert.equal(a.v.chat[0].mine, true);
    assert.equal(a.v.seq, seq); assert.equal(a.v.phase, 'play');
    assert.equal(await b.tryCmd({ t: 'chat', text: '   ' }), 'bad');
    assert.equal(await b.tryCmd({ t: 'chat', text: 42 }), 'bad');
    assert.equal(await b.tryCmd({ t: 'chat', text: 'x'.repeat(201) }), 'long');
    const errs = [];
    for (let k = 0; k < 6; k++) errs.push(await b.tryCmd({ t: 'chat', text: 'spam ' + k }, 20));
    assert.ok(errs.includes('chat-slow'), 'gửi dồn bị chặn');
    const z = await new Client(S.url, 'Z').open();
    assert.equal(await z.tryCmd({ t: 'chat', text: 'xin chào' }), 'no-room');
    for (const x of [a, b, z]) x.close();
  } finally { await S.stop(); }
});
