// Test máy chủ phòng Cờ Tướng qua WebSocket THẬT (WebSocket có sẵn trong Node ≥ 22) + máy chủ thật trên cổng ngẫu nhiên.
// Chạy: node --test --test-concurrency=1 games-server/co-tuong/test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import * as L from "../../../prototype/games/co-tuong/logic.js";
import * as A from "../../../prototype/games/co-tuong/ai.js";
const require = createRequire(import.meta.url);
const { createCoTuongHost } = require('../host.js');
const { Room } = require('../room.js');

const FAST = { turn: 400, away: 150 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer(opts = {}) {
  const server = http.createServer((q, s) => s.end('x'));
  const host = createCoTuongHost(server, { timings: FAST, lobbyGraceMs: 200, ...opts });
  await host.ready;
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `ws://127.0.0.1:${server.address().port}/ws/co-tuong`;
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
// ô theo kiểu "e0": cột a–i, hàng 0 = phía Đỏ (dưới)
const sq = (n) => (9 - Number(n.slice(1))) * 9 + (n.charCodeAt(0) - 97);
// đi nước f→t bởi client c rồi chờ cả hai thấy seq tăng (hoặc ván kết thúc)
async function mv(c, both, f, t) {
  const seq = c.v.seq, gid = c.v.gid;
  c.send({ t: 'move', f: sq(f), to: sq(t) });
  for (const x of both) await x.next(st((v) => v.seq > seq || v.gid !== gid || v.phase !== 'play'));
}

test('tạo phòng + vào bằng mã không phân biệt hoa thường; người thứ 3 bị từ chối; mã sai báo no-room', async () => {
  const S = await startServer();
  try {
    const [a, b] = await pair(S.url);
    assert.deepEqual(a.v.players.map((p) => p.name), ['An', 'Bình']);
    assert.equal(a.v.you, 0); assert.equal(b.v.you, 1); assert.equal(b.v.host, 0);
    const c = await new Client(S.url, 'C').open();
    assert.equal(await c.tryCmd({ t: 'join', code: a.code, name: 'x' }), 'full');
    assert.equal(await c.tryCmd({ t: 'join', code: 'ZZZZ2', name: 'x' }), 'no-room');
    for (const x of [a, b, c]) x.close();
  } finally { await S.stop(); }
});

test('chỉ chủ phòng bắt đầu; cần đủ 2 người; chủ phòng cầm Đỏ ván đầu; bắt đầu rồi không vào thêm được', async () => {
  const S = await startServer();
  try {
    const a = await new Client(S.url, 'A').open();
    a.send({ t: 'create', name: 'An' }); await a.next((m) => m.t === 'joined');
    assert.equal(await a.tryCmd({ t: 'start' }), 'need-2');
    const b = await new Client(S.url, 'B').open();
    b.send({ t: 'join', code: a.code, name: 'Bình' }); await b.next((m) => m.t === 'joined');
    assert.equal(await b.tryCmd({ t: 'start' }), 'not-host');
    a.send({ t: 'start' }); await b.next(st((v) => v.phase === 'play'));
    assert.equal(b.v.redSeat, 0); assert.equal(b.v.game.turn, 1);
    assert.equal(b.v.game.board, L.parse(L.START).join(''));
    const c = await new Client(S.url, 'C').open();
    assert.equal(await c.tryCmd({ t: 'join', code: a.code, name: 'x' }), 'started');
    for (const x of [a, b, c]) x.close();
  } finally { await S.stop(); }
});

test('xác thực nước đi: sai lượt, quân đối phương, sai luật, không giải chiếu, toạ độ rác, kèm trường giả đều bị từ chối', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    assert.equal(await b.tryCmd({ t: 'move', f: sq('b7'), to: sq('e7') }), 'not-turn', 'Đen không đi trước');
    assert.equal(await a.tryCmd({ t: 'move', f: sq('b7'), to: sq('e7') }), 'illegal', 'Đỏ không đi quân Đen');
    assert.equal(await a.tryCmd({ t: 'move', f: sq('b2'), to: sq('b7') }), 'illegal', 'pháo không ăn khi không có ngòi');
    assert.equal(await a.tryCmd({ t: 'move', f: sq('b0'), to: sq('d1') }), 'illegal', 'mã bị cản chân');
    assert.equal(await a.tryCmd({ t: 'move', f: sq('a0'), to: sq('a5') }), 'illegal', 'xe không nhảy qua tốt');
    assert.equal(await a.tryCmd({ t: 'move', f: sq('e0'), to: sq('e2') }), 'illegal', 'tướng đi 2 ô');
    assert.equal(await a.tryCmd({ t: 'move', f: sq('e3'), to: sq('e3') }), 'illegal', 'đứng yên');
    assert.equal(await a.tryCmd({ t: 'move', f: sq('d5'), to: sq('d6') }), 'illegal', 'ô trống');
    assert.equal(await a.tryCmd({ t: 'move', f: 90, to: 3 }), 'bad');
    assert.equal(await a.tryCmd({ t: 'move', f: -1, to: 3 }), 'bad');
    assert.equal(await a.tryCmd({ t: 'move', f: '64', to: 67 }), 'bad');
    assert.equal(await a.tryCmd({ t: 'move', f: 64.5, to: 67 }), 'bad');
    assert.equal(await a.tryCmd({ t: 'move', f: sq('b2') }), 'bad');
    assert.equal(await a.tryCmd({ t: 'again' }), 'phase', 'không xin ván mới giữa ván');
    assert.equal(await a.tryCmd({ t: 'undo' }), 'bad', 'online không có đi lại');
    assert.equal(a.v.seq, 0);
    // gửi kèm bàn / người thắng / màu giả → bị bỏ qua
    a.send({ t: 'move', f: sq('b2'), to: sq('e2'), board: '.'.repeat(90), winner: 1, p: 2, turn: 1 });
    await b.next(st((v) => v.seq === 1));
    assert.deepEqual(b.v.game.moves.at(-1).slice(0, 2), [sq('b2'), sq('e2')]);
    assert.equal(b.v.game.winner, 0); assert.equal(b.v.game.turn, 2);
    assert.equal(await a.tryCmd({ t: 'move', f: sq('h2'), to: sq('e2') }), 'not-turn', 'Đỏ không đi 2 nước liền');
    await mv(b, [a, b], 'h7', 'e7');
    await mv(a, [a, b], 'e2', 'e6');           // pháo đỏ ăn tốt e6 (ngòi tốt e3) → chiếu tướng e9 qua ngòi pháo đen e7
    assert.equal(b.v.game.check, true, 'Đen đang bị chiếu');
    assert.equal(await b.tryCmd({ t: 'move', f: sq('a9'), to: sq('a8') }), 'illegal', 'không giải chiếu = phạm luật');
    assert.equal(await b.tryCmd({ t: 'move', f: sq('e9'), to: sq('e8') }), 'illegal', 'tướng chạy vào ô vẫn bị chiếu');
    await mv(b, [a, b], 'd9', 'e8');           // sĩ lên che → hai ngòi → hết chiếu
    assert.equal(a.v.game.check, false);
    assert.equal(a.v.game.board, b.v.game.board);
    const r = L.replay(L.newMatch(), a.v.game.moves.map((x) => [x[0], x[1]]));
    assert.equal(r.board.join(''), a.v.game.board, 'dựng lại bằng logic.js ra đúng bàn');
    for (const raw of [...a.raw, ...b.raw].filter((t) => !t.startsWith('{"t":"joined"'))) assert.ok(!raw.includes(a.token) && !raw.includes(b.token), 'không lộ token');
    for (const x of [a, b]) x.close();
  } finally { await S.stop(); }
});

test('chiếu bí kết thúc ván + cộng điểm đúng người (máy chủ quyết, không tin client)', async () => {
  // Dựng sẵn thế gần bí trên Room (đồng hồ giả), Đỏ đi xe chiếu hết
  const clock = { now: () => 0, setTimeout: () => 0, clearTimeout() {} };
  const r = new Room({ code: 'ABCDE', L, A, clock });
  r.join('A', 'ta'); r.join('B', 'tb'); r.handle(0, { t: 'start' });
  const board = L.parse('3k5/R8/9/9/9/9/9/9/9/1R2K4');
  r.s = { ...r.s, board, keys: [L.key(board, 1)] };
  assert.deepEqual(r.handle(1, { t: 'move', f: sq('d9'), to: sq('d8') }), { err: 'not-turn' });
  assert.deepEqual(r.handle(0, { t: 'move', f: sq('b0'), to: sq('b9') }), { ok: true });
  assert.equal(r.phase, 'over'); assert.equal(r.s.winner, 1); assert.equal(r.s.reason, 'checkmate');
  assert.deepEqual(r.score, [1, 0]);
  assert.deepEqual(r.handle(1, { t: 'move', f: sq('d9'), to: sq('e9') }), { err: 'phase' });
  r.handle(1, { t: 'again' });
  assert.equal(r.phase, 'over', 'một người bấm Ván tiếp: chưa mở ván (chờ người kia / đếm ngược)');
  r.handle(0, { t: 'again' });
  assert.equal(r.redSeat, 1); assert.equal(r.round, 2);
  r.close();
});

test('xin thua: ván kết thúc, điểm cộng cho đối thủ (theo người); ván sau đổi màu, điểm vẫn theo người', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    b.send({ t: 'resign' }); // Đen (B) xin thua dù không tới lượt
    await a.next(st((v) => v.phase === 'over'));
    assert.equal(a.v.game.winner, 1); assert.equal(a.v.game.reason, 'resign');
    assert.deepEqual(a.v.score, [1, 0]); assert.deepEqual(a.v.endBy, { kind: 'resign', seat: 1 });
    assert.equal(await a.tryCmd({ t: 'resign' }), 'phase', 'không xin thua khi ván đã xong');
    assert.equal(await a.tryCmd({ t: 'move', f: sq('b2'), to: sq('e2') }), 'phase');
    // BRD-09: một người bấm ⇒ người kia thấy "đối thủ muốn chơi tiếp" + hạn đếm ngược; ván chưa mở (thẻ kết quả còn đó)
    b.send({ t: 'again' }); await a.next(st((v) => v.phase === 'over' && v.again[1] === true));
    a.send({ t: 'again' }); await a.next(st((v) => v.phase === 'play' && v.round === 2));
    assert.equal(a.v.redSeat, 1, 'ván 2: B cầm Đỏ');
    assert.equal(await a.tryCmd({ t: 'move', f: sq('b2'), to: sq('e2') }), 'not-turn', 'A (đang cầm Đen) không đi trước');
    await mv(b, [a, b], 'b2', 'e2');
    a.send({ t: 'resign' }); await b.next(st((v) => v.phase === 'over'));
    assert.equal(b.v.game.winner, 1, 'Đỏ thắng'); assert.deepEqual(b.v.score, [1, 1], 'điểm cộng cho B (người cầm Đỏ ván này)');
    for (const x of [a, b]) x.close();
  } finally { await S.stop(); }
});

test('cầu hòa: đối thủ đồng ý → hòa; từ chối / đi tiếp → huỷ lời mời; mỗi nước chỉ cầu hòa 1 lần (chống spam)', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    assert.equal(await a.tryCmd({ t: 'draw-no' }), 'phase', 'không có lời mời để từ chối');
    a.send({ t: 'draw' }); await b.next(st((v) => v.drawOffer === 0));
    b.send({ t: 'draw-no' }); await a.next(st((v) => v.drawOffer === -1));
    assert.equal(await a.tryCmd({ t: 'draw' }), 'slow', 'cầu hòa lại ngay khi chưa có nước mới');
    await mv(a, [a, b], 'b2', 'e2');
    b.send({ t: 'draw' }); await a.next(st((v) => v.drawOffer === 1));
    await mv(b, [a, b], 'h7', 'e7');           // B đi tiếp: lời mời của chính B vẫn giữ
    assert.equal(a.v.drawOffer, 1);
    await mv(a, [a, b], 'h0', 'g2');           // A đi tiếp không trả lời → coi như từ chối
    assert.equal(b.v.drawOffer, -1);
    assert.equal(await b.tryCmd({ t: 'draw' }), null, 'đã có nước mới → được cầu hòa lại');
    await a.next(st((v) => v.drawOffer === 1));
    a.send({ t: 'draw' }); await b.next(st((v) => v.phase === 'over'));
    assert.equal(b.v.game.winner, 3); assert.equal(b.v.draws, 1); assert.deepEqual(b.v.score, [0, 0]);
    for (const x of [a, b]) x.close();
  } finally { await S.stop(); }
});

test('người có lượt im lặng quá hạn → máy chủ đi thay bằng nước hợp lệ; mất kết nối → đi thay sớm hơn', async () => {
  const S = await startServer({ timings: { turn: 250, away: 80 } });
  try {
    const [a, b] = await started(S.url);
    await b.next(st((v) => v.seq >= 1), 3000);
    assert.ok(b.v.act.auto, 'đánh dấu là máy đi thay'); assert.equal(b.v.act.p, 1);
    assert.ok(L.replay(L.newMatch(), b.v.game.moves.map((x) => [x[0], x[1]])), 'nước máy đi hợp lệ');
    b.close(); const t0 = Date.now();
    await a.next(st((v) => v.seq >= 2), 3000);
    assert.ok(Date.now() - t0 < 600, 'đi thay sớm vì mất kết nối');
    assert.equal(a.v.players[1].connected, false);
    a.close();
  } finally { await S.stop(); }
});

test('rớt mạng giữa ván: giữ ghế, quay lại bằng token; token sai bị từ chối; tab cũ bị thay', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    await mv(a, [a, b], 'b2', 'e2');
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
    await mv(b3, [a, b3], 'h7', 'e7');
    assert.deepEqual(a.v.game.moves.at(-1).slice(0, 2), [sq('h7'), sq('e7')]);
    for (const x of [a, b3, bad]) x.close();
  } finally { await S.stop(); }
});

test('một người rời → về phòng chờ, người còn lại làm chủ, điểm làm lại; người mới vào chơi tiếp được', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    b.send({ t: 'resign' }); await a.next(st((v) => v.phase === 'over'));
    a.send({ t: 'leave' }); await a.next((m) => m.t === 'left');
    await b.next(st((v) => v.phase === 'lobby' && v.players.length === 1));
    assert.equal(b.v.you, 0); assert.equal(b.v.host, 0); assert.equal(b.v.oppLeft, true); assert.equal(b.v.game, null);
    assert.deepEqual(b.v.score, [0, 0]);
    const c = await new Client(S.url, 'C').open();
    c.send({ t: 'join', code: b.code, name: 'Chi' }); await c.next((m) => m.t === 'joined');
    b.send({ t: 'start' }); await c.next(st((v) => v.phase === 'play'));
    assert.equal(c.v.oppLeft, false); assert.equal(c.v.redSeat, 0); assert.equal(c.v.round, 1);
    assert.equal(await a.tryCmd({ t: 'move', f: 0, to: 9 }), 'no-room', 'người đã rời không gửi lệnh được nữa');
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
    assert.equal(await a.tryCmd({ t: 'move', f: 1, to: 2 }), 'no-room');
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

test('hạn nước đi không kéo dài được bằng ngắt/nối; máy chủ đi thay đúng hạn (đồng hồ giả)', () => {
  let now = 0, timers = [];
  const clock = { now: () => now, setTimeout: (f, ms) => { const t = { at: now + ms, f }; timers.push(t); return t; }, clearTimeout: (t) => { timers = timers.filter((x) => x !== t); } };
  const tick = (to) => { for (;;) { const t = timers.filter((x) => x.at <= to).sort((a, b) => a.at - b.at)[0]; if (!t) break; timers = timers.filter((x) => x !== t); now = t.at; t.f(); } now = to; };
  const r = new Room({ code: 'ABCDE', L, A, clock, timings: { turn: 60000, away: 15000 } });
  r.join('A', 'ta'); r.join('B', 'tb'); r.handle(0, { t: 'start' });
  assert.equal(r.deadline, 60000);
  for (let t = 59000; t < 59900; t += 100) { tick(t); r.setConnected(1, false); r.setConnected(1, true); }
  assert.equal(r.deadline, 60000, 'hạn không bị đẩy lùi');
  tick(60001); assert.equal(r.seq, 1, 'máy chủ đi thay đúng hạn');
  const base = r.deadline;
  tick(now + 50000); r.setConnected(1, false);
  assert.equal(r.deadline, base, 'mất kết nối gần hết hạn không làm hạn dài thêm');
  r.setConnected(1, true); assert.equal(r.deadline, base);
  assert.deepEqual(r.handle(5, { t: 'move', f: 0, to: 9 }), { err: 'no-seat' });
  r.close();
  assert.deepEqual(r.handle(0, { t: 'resign' }), { err: 'no-room' });
});

test('server.js gắn Cờ Tướng mặc định, tắt được bằng COTUONG_ONLINE=0', async () => {
  const { execFileSync } = await import('node:child_process');
  const probe = (env) => execFileSync(process.execPath, ['-e', `
    const s=require('./server.js'); s.listen(0,'127.0.0.1',async()=>{const p=s.address().port;
      const ws=new WebSocket('ws://127.0.0.1:'+p+'/ws/co-tuong');
      const t=setTimeout(()=>{console.log('off');process.exit(0)},800);
      ws.onopen=()=>{clearTimeout(t);console.log('on');process.exit(0)}; ws.onerror=()=>{clearTimeout(t);console.log('off');process.exit(0)};});`],
    { cwd: new URL('../../../', import.meta.url), env: { ...process.env, MASOI_ONLINE: '0', NOITU_ONLINE: '0', COCARO_ONLINE: '0', ...env }, encoding: 'utf8' }).trim().split('\n').pop();
  assert.equal(probe({ COTUONG_ONLINE: '1' }), 'on');
  assert.equal(probe({ COTUONG_ONLINE: '' }), 'on');
  assert.equal(probe({ COTUONG_ONLINE: '0' }), 'off');
});

test('chat: tên người gửi do máy chủ gắn; làm sạch; giới hạn độ dài; không đổi ván; người ngoài phòng không chat được', async () => {
  const S = await startServer();
  try {
    const [a, b] = await started(S.url);
    const seq = a.v.seq;
    a.send({ t: 'chat', text: '  Chào‮\u0007  bạn <3  ', name: 'Bình', from: 1, mine: false, id: 999 });
    await b.next(st((v) => v.chat.length === 1));
    const [m] = b.v.chat;
    assert.equal(m.name, 'An'); assert.equal(m.mine, false);
    assert.ok(!m.text.includes('‮') && !m.text.includes('\u0007') && m.text.startsWith('Chào'));
    assert.equal(a.v.seq, seq); assert.equal(a.v.phase, 'play');
    assert.equal(await b.tryCmd({ t: 'chat', text: '   ' }), 'bad');
    assert.equal(await b.tryCmd({ t: 'chat', text: 'x'.repeat(201) }), 'long');
    const z = await new Client(S.url, 'Z').open();
    assert.equal(await z.tryCmd({ t: 'chat', text: 'xin chào' }), 'no-room');
    for (const x of [a, b, z]) x.close();
  } finally { await S.stop(); }
});

// ——— Các lỗi Codex tìm ra khi review e08125d ———
test('review: tên tạo phòng không phải chuỗi không để lại phòng rác; IP đó vẫn tạo phòng hợp lệ được', async () => {
  const S = await startServer();
  try {
    for (let i = 0; i < 3; i++) {
      const c = await new Client(S.url, 'x' + i).open();
      c.send({ t: 'create', name: { toString: null } }); await c.next((m) => m.t === 'joined' || m.t === 'err');
      c.close(); await c.closed;
    }
    await sleep(400); // hết ân hạn phòng chờ (200 ms trong test) → phòng không còn ai bị xoá
    assert.equal(S.host.rooms.size, 0, 'không còn phòng mồ côi');
    const ok = await new Client(S.url, 'ok').open();
    ok.send({ t: 'create', name: 'Hợp lệ' });
    const r = await ok.next((m) => m.t === 'joined' || m.t === 'err');
    assert.equal(r.t, 'joined', 'không bị busy');

    for (const e of S.host.rooms.values()) assert.ok(e.room.players.length >= 1, 'không có phòng rỗng');
    ok.close();
  } finally { await S.stop(); }
});

test('review: lệnh xin thua / cầu hòa / nước đi gửi từ ván cũ không áp sang ván mới', async () => {
  const S = await startServer({ timings: { turn: 60000, away: 60000 } });
  try {
    const [a, b] = await started(S.url);
    const oldGid = a.v.gid;
    b.send({ t: 'resign', gid: oldGid }); await a.next(st((v) => v.phase === 'over'));
    b.send({ t: 'again', gid: oldGid }); await a.next(st((v) => v.phase === 'over' && v.again[1] === true));
    a.send({ t: 'again', gid: oldGid }); await a.next(st((v) => v.phase === 'play' && v.gid !== oldGid));
    await b.next(st((v) => v.phase === 'play' && v.gid !== oldGid));
    assert.equal(await a.tryCmd({ t: 'resign', gid: oldGid }), 'stale');
    assert.equal(await a.tryCmd({ t: 'draw', gid: oldGid }), 'stale');
    assert.equal(await b.tryCmd({ t: 'again', gid: oldGid }), 'stale');
    assert.equal(a.v.phase, 'play'); assert.equal(a.v.drawOffer, -1);
    // ván 2: B cầm Đỏ. Nước gửi với seq cũ bị bỏ
    const g = b.v.gid;
    b.send({ t: 'move', f: sq('b2'), to: sq('e2'), gid: g, seq: 0 }); await a.next(st((v) => v.seq === 1));
    assert.equal(await a.tryCmd({ t: 'move', f: sq('b7'), to: sq('e7'), gid: g, seq: 0 }), 'stale');
    a.send({ t: 'move', f: sq('b7'), to: sq('e7'), gid: g, seq: 1 }); await b.next(st((v) => v.seq === 2));
    a.close(); b.close();
  } finally { await S.stop(); }
});

test('review: hết hạn mà hẹn giờ chưa chạy → không nhận nước trễ, máy chủ đi thay ngay', () => {
  let now = 0; const clock = { now: () => now, setTimeout: () => ({}), clearTimeout: () => {} }; // hẹn giờ không bao giờ tự chạy
  const r = new Room({ code: 'ABCDE', L, A, clock, timings: { turn: 60000, away: 15000 } });
  r.join('A', 'ta'); r.join('B', 'tb'); r.handle(0, { t: 'start' });
  now = 60001;
  assert.deepEqual(r.handle(0, { t: 'move', f: sq('b2'), to: sq('e2') }), { err: 'not-turn' });
  assert.equal(r.seq, 1); assert.equal(r.lastAct.auto, true);
  assert.equal(r.deadline, 120001);
});

test('review: hai khung hợp lệ ~600 byte gộp trong một lần ghi TCP không bị đóng 1009', async () => {
  const S = await startServer();
  try {
    const net = await import('node:net');
    const port = new URL(S.url).port;
    const sock = net.connect(port, '127.0.0.1');
    let got = '';
    sock.on('data', (d) => { got += d.toString('latin1'); });
    await new Promise((r) => sock.on('connect', r));
    sock.write(`GET /ws/co-tuong HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n`);
    await sleep(100);
    const frame = (txt) => { const p = Buffer.from(txt), m = Buffer.from([1, 2, 3, 4]); const h = Buffer.from([0x81, 0x80 | 126, p.length >> 8, p.length & 255]); const x = Buffer.from(p); for (let i = 0; i < x.length; i++) x[i] ^= m[i & 3]; return Buffer.concat([h, m, x]); };
    const msg = JSON.stringify({ t: 'ping', pad: 'x'.repeat(580) });
    assert.ok(msg.length > 590 && msg.length < 1024);
    sock.write(Buffer.concat([frame(msg), frame(msg)]));
    await sleep(200);
    assert.equal((got.match(/"pong"/g) || []).length, 2, 'nhận đủ 2 pong');
    assert.ok(!sock.destroyed && !got.includes('\x88\x02\x03\xf1'), 'không bị đóng 1009');
    sock.destroy();
  } finally { await S.stop(); }
});
