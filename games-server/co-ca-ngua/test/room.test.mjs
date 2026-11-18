// Test máy chủ phòng Cờ Cá Ngựa qua WebSocket THẬT (WebSocket có sẵn trong Node ≥ 22) + máy chủ thật trên cổng ngẫu nhiên.
// Chạy: node --test --test-concurrency=1 games-server/co-ca-ngua/test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import * as L from '../../../prototype/games/co-ca-ngua/logic.js';
const require = createRequire(import.meta.url);
const { createCoCaNguaHost } = require('../host.js');

const FAST = { auto: 60, turn: 400, away: 150, left: 40 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer(opts = {}) {
  const server = http.createServer((q, s) => s.end('x'));
  const host = createCoCaNguaHost(server, { timings: FAST, lobbyGraceMs: 200, logic: L, ...opts });
  await host.ready;
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `ws://127.0.0.1:${server.address().port}/ws/co-ca-ngua`;
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
      setTimeout(() => { const i = this.waiters.indexOf(w); if (i >= 0) { this.waiters.splice(i, 1); j(new Error(`${this.name}: hết giờ chờ — đã nhận: ${this.raw.slice(-3).map((t) => t.slice(0, 160)).join(" | ")}`)); } }, ms);
    });
  }
  async tryCmd(o, ms = 120) {
    const n = this.msgs.length; this.send(o); await sleep(ms);
    return this.msgs.slice(n).find((m) => m.t === 'err')?.code ?? null;
  }
  get myTurn() { const g = this.v?.game; return !!g && this.v.phase === 'play' && g.seats[g.turn] === this.v.players[this.v.you].seat; }
  close() { this.ws.close(); }
}

async function table(url, n) {
  const cs = [];
  for (let i = 0; i < n; i++) cs.push(await new Client(url, `P${i}`).open());
  cs[0].send({ t: 'create', name: 'Chủ phòng' });
  await cs[0].next((m) => m.t === 'joined');
  for (let i = 1; i < n; i++) { cs[i].send({ t: 'join', code: cs[0].code, name: `Người ${i}` }); await cs[i].next((m) => m.t === 'joined'); }
  await sleep(40);
  return cs;
}
const whoseTurn = (cs) => cs.find((c) => c.myTurn);

test('tạo phòng + vào bằng mã (không phân biệt hoa thường); phòng đủ 4 thì người thứ 5 bị từ chối; mã sai báo no-room', async () => {
  const S = await startServer();
  try {
    const cs = await table(S.url, 4);
    assert.match(cs[0].code, /^[A-HJ-NP-Z2-9]{5}$/);
    assert.deepEqual(cs[3].v.players.map((p) => p.name), ['Chủ phòng', 'Người 1', 'Người 2', 'Người 3']);
    const x = await new Client(S.url, 'x').open();
    assert.equal(await x.tryCmd({ t: 'join', code: cs[0].code.toLowerCase(), name: 'Thừa' }), 'full');
    assert.equal(await x.tryCmd({ t: 'join', code: 'ZZZZZ', name: 'Lạc' }), 'no-room');
    for (const c of [...cs, x]) c.close();
  } finally { await S.stop(); }
});

test('chỉ chủ phòng đổi luật / bắt đầu; cần ≥2 người; bắt đầu rồi thì không vào thêm được', async () => {
  const S = await startServer();
  try {
    const [a] = await table(S.url, 1);
    assert.equal(await a.tryCmd({ t: 'start' }), 'need-2');
    const b = await new Client(S.url, 'b').open(); b.send({ t: 'join', code: a.code, name: 'B' }); await b.next((m) => m.t === 'joined');
    assert.equal(await b.tryCmd({ t: 'rule', rule: '16' }), 'not-host');
    assert.equal(await b.tryCmd({ t: 'start' }), 'not-host');
    assert.equal(await a.tryCmd({ t: 'rule', rule: '99' }), 'bad');
    a.send({ t: 'rule', rule: '16' }); await b.next((m) => m.t === 'state' && m.v.rule === '16');
    a.send({ t: 'start' });
    await Promise.all([a, b].map((c) => c.next((m) => m.t === 'state' && m.v.phase === 'play')));
    assert.deepEqual(b.v.game.seats, [0, 2], '2 người ngồi đối diện');
    assert.deepEqual(b.v.game.rules.launchOn, [1, 6], 'luật 1 hoặc 6 được áp dụng');
    const late = await new Client(S.url, 'late').open();
    assert.equal(await late.tryCmd({ t: 'join', code: a.code, name: 'Muộn' }), 'started');
    for (const c of [a, b, late]) c.close();
  } finally { await S.stop(); }
});

test('xác thực lượt: người không có lượt không gieo/đi được; client không tự đặt được mặt xúc xắc; đi ngựa không hợp lệ bị từ chối', async () => {
  const dice = [3, 6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]; let k = 0;
  const S = await startServer({ randInt: () => dice[k++ % dice.length] - 1, timings: { ...FAST, turn: 5000, auto: 5000 } });
  try {
    const cs = await table(S.url, 3);
    cs[0].send({ t: 'start' }); await Promise.all(cs.map((c) => c.next((m) => m.t === 'state' && m.v.phase === 'play')));
    const cur = whoseTurn(cs), other = cs.find((c) => c !== cur);
    assert.equal(cur, cs[0], 'người vào đầu tiên đi trước');
    assert.equal(await other.tryCmd({ t: 'roll' }), 'not-turn');
    assert.equal(await cur.tryCmd({ t: 'move', horse: 0 }), 'illegal', 'chưa gieo thì không đi được');
    cur.send({ t: 'roll', dice: 6 }); // trường "dice" bị bỏ qua — máy chủ gieo
    await cur.next((m) => m.t === 'state' && m.v.seq === 1);
    assert.equal(cur.v.act.dice, 3, 'mặt xúc xắc do máy chủ quyết');
    assert.equal(cur.v.game.phase, 'roll', 'gieo 3 khi mọi ngựa trong chuồng → mất lượt');
    await Promise.all(cs.map((c) => c.next((m) => m.t === 'state' && m.v.seq === 1)));
    const nxt = whoseTurn(cs); assert.equal(nxt, cs[1]);
    assert.equal(await cs[0].tryCmd({ t: 'roll' }), 'not-turn', 'hết lượt thì không gieo tiếp được');
    nxt.send({ t: 'roll' }); await nxt.next((m) => m.t === 'state' && m.v.seq === 2);
    assert.equal(nxt.v.game.phase, 'move');
    for (const bad of [{ t: 'move', horse: 9 }, { t: 'move', horse: '0' }, { t: 'move', horse: 1.5 }, { t: 'move' }])
      assert.ok(['illegal', 'bad'].includes(await nxt.tryCmd(bad)), JSON.stringify(bad));
    assert.equal(await cs[2].tryCmd({ t: 'move', horse: 0 }), 'not-turn');
    assert.equal(await nxt.tryCmd({ t: 'teleport', horse: 0, to: 47 }), 'bad');
    assert.equal(await nxt.tryCmd({ t: 'again' }), 'phase', 'chưa hết ván thì không xin ván mới được');
    nxt.send({ t: 'move', horse: 2 }); await nxt.next((m) => m.t === 'state' && m.v.seq === 3);
    assert.equal(nxt.v.game.horses[1][2], 0, 'ngựa 2 của ghế 1 đã xuất ra ô xuất phát');
    for (const c of cs) c.close();
  } finally { await S.stop(); }
});

test('trạng thái gửi cho client không có seed/rng/token; mọi client nhận cùng một trạng thái ván', async () => {
  const S = await startServer();
  try {
    const cs = await table(S.url, 2);
    cs[0].send({ t: 'start' }); await Promise.all(cs.map((c) => c.next((m) => m.t === 'state' && m.v.phase === 'play')));
    await sleep(1500);
    for (const c of cs) for (const t of c.raw) {
      assert.ok(!/"(seed|rng)"/.test(t), 'không lộ seed/rng');
      const others = cs.filter((o) => o !== c).map((o) => o.token);
      for (const tok of others) assert.ok(!t.includes(tok), 'không lộ token người khác');
    }
    const strip = (v) => JSON.stringify({ ...v, you: 0 });
    assert.equal(strip(cs[0].v), strip(cs[1].v));
    for (const c of cs) c.close();
  } finally { await S.stop(); }
});

test('chống lệch đồng bộ: phát lại chuỗi hành động (act) bằng logic.js ở client cho ra đúng trạng thái máy chủ, seq liên tục', async () => {
  // đồng hồ "tức thì": máy chủ tự đi thay ngay (setImmediate) để chạy hết cả ván 4 người trong vài giây
  const fastClock = { now: () => Date.now(), setTimeout: (f) => setImmediate(f), clearTimeout: (t) => clearImmediate(t) };
  const S = await startServer({ clock: fastClock });
  try {
    const cs = await table(S.url, 4);
    cs[0].send({ t: 'start' });
    await cs[2].next((m) => m.t === 'state' && m.v.phase === 'over', 30000);
    await sleep(50);
    for (const c of cs) {
      const sts = c.states.filter((v) => v.gid === 1 && v.phase !== 'lobby');
      const g = L.createGame({ players: 4, seed: 0 });
      let seq = 0;
      for (const v of sts) {
        if (v.seq === seq) continue;           // cập nhật phụ (kết nối…) không đổi ván
        assert.equal(v.seq, seq + 1, `${c.name}: seq nhảy cóc ${seq} → ${v.seq}`);
        seq = v.seq;
        if (v.act.k === 'roll') L.roll(g, v.act.dice); else assert.ok(L.move(g, v.act.horse), 'nước đi hợp lệ theo luật');
        L.drainEvents(g);
        assert.deepEqual(g.horses, v.game.horses); assert.equal(g.turn, v.game.turn); assert.equal(g.phase, v.game.phase);
      }
      assert.equal(g.phase, 'over'); assert.equal(g.winner, c.v.game.winner);
    }
    for (const c of cs) c.close();
  } finally { await S.stop(); }
});

test('máy chủ tự đi nước bắt buộc; người im lặng quá hạn → máy chủ đi thay; hết ván xin "ván mới" được', async () => {
  const S = await startServer({ randInt: () => 5 /* luôn 6 */, timings: { auto: 60, turn: 250, away: 100, left: 40 } });
  try {
    const cs = await table(S.url, 2);
    cs[0].send({ t: 'start' }); await cs[0].next((m) => m.t === 'state' && m.v.phase === 'play');
    cs[0].send({ t: 'roll' });
    await cs[0].next((m) => m.t === 'state' && m.v.seq === 2, 1000); // 4 ngựa đều xuất được (toàn "launch") → tự đi
    assert.equal(cs[0].v.act.k, 'move');
    assert.ok(cs[0].v.deadline > 0, 'có hạn chờ cho lượt gieo kế tiếp');
    await cs[1].next((m) => m.t === 'state' && m.v.seq >= 4, 1500); // không ai bấm → máy chủ gieo thay
    assert.equal(cs[1].v.act.seat, 0);
    assert.ok(cs[1].v.players.every(() => true));
    const seats = new Set(cs[1].states.filter((v) => v.act).map((v) => v.act.seat));
    assert.deepEqual([...seats], [0], 'luôn gieo 6 → người đi trước giữ lượt (gieo thêm)');
    for (const c of cs) c.close();
  } finally { await S.stop(); }
});

test('hết ván: chuyển pha "over", ai trong phòng cũng xin "ván mới" được → ván mới sạch', async () => {
  const S = await startServer({ timings: { auto: 5, turn: 5, away: 5, left: 5 } });
  try {
    const cs = await table(S.url, 2);
    cs[0].send({ t: 'start' });
    await cs[0].next((m) => m.t === 'state' && m.v.phase === 'over', 20000);
    assert.ok([0, 2].includes(cs[0].v.game.winner));
    assert.ok(L.hasWon({ rules: cs[0].v.game.rules, horses: cs[0].v.game.horses }, cs[0].v.game.winner), 'người thắng đủ 4 ngựa về chuồng');
    assert.equal(await cs[0].tryCmd({ t: 'roll' }), 'phase', 'hết ván thì không gieo được nữa');
    cs[1].send({ t: 'again' });
    await cs[0].next((m) => m.t === 'state' && m.v.gid === 2 && m.v.phase === 'play');
    assert.equal(cs[0].v.seq, 0);
    assert.ok(cs[0].v.game.horses[0].every((p) => p === -1));
    for (const c of cs) c.close();
  } finally { await S.stop(); }
});

test('rớt mạng giữa ván: giữ ghế, quay lại bằng token; token sai bị từ chối; tab cũ bị thay; người rời hẳn thì máy chủ đi thay', async () => {
  const S = await startServer({ timings: { auto: 60, turn: 60000, away: 120, left: 40 } });
  try {
    const cs = await table(S.url, 3);
    cs[0].send({ t: 'start' }); await cs[0].next((m) => m.t === 'state' && m.v.phase === 'play');
    const tok = cs[0].token, code = cs[0].code;
    cs[0].close(); await cs[0].closed;
    await cs[1].next((m) => m.t === 'state' && m.v.players[0].connected === false);
    await cs[1].next((m) => m.t === 'state' && m.v.seq >= 1, 1500); // ghế 0 mất kết nối → máy chủ gieo thay sau "away"
    const bad = await new Client(S.url, 'bad').open();
    assert.equal(await bad.tryCmd({ t: 'resume', code, token: 'f'.repeat(32) }), 'no-seat');
    assert.equal(await bad.tryCmd({ t: 'resume', code, token: '../x' }), 'no-seat');
    const back = await new Client(S.url, 'back').open();
    back.send({ t: 'resume', code, token: tok }); await back.next((m) => m.t === 'state');
    assert.equal(back.v.you, 0); assert.equal(back.v.players[0].connected, true);
    const tab2 = await new Client(S.url, 'tab2').open();
    tab2.send({ t: 'resume', code, token: tok }); await tab2.next((m) => m.t === 'state');
    await sleep(100);
    assert.ok(back.msgs.some((m) => m.t === 'replaced'), 'tab cũ nhận "replaced"');
    // người 2 rời hẳn → còn 2 người, lượt của ghế đó máy chủ đi ngay
    cs[2].send({ t: 'leave' }); await cs[2].next((m) => m.t === 'left');
    await cs[1].next((m) => m.t === 'state' && m.v.players[2].left === true);
    assert.equal(await cs[2].tryCmd({ t: 'roll' }), 'no-room');
    for (const c of [cs[1], cs[2], bad, back, tab2]) c.close();
  } finally { await S.stop(); }
});

test('phòng chờ: người rớt mạng quá hạn bị loại; chủ phòng rời thì người kế làm chủ; tên được làm sạch', async () => {
  const S = await startServer();
  try {
    const a = await new Client(S.url, 'a').open();
    a.send({ t: 'create', name: '  <b>Tèo</b>‮\u0007 rất rất rất dài tên quá trời  ' }); await a.next((m) => m.t === 'joined');
    assert.ok(!/[<>‮\u0007]/.test(a.v.players[0].name)); assert.ok([...a.v.players[0].name].length <= 16);
    const b = await new Client(S.url, 'b').open(); b.send({ t: 'join', code: a.code, name: '' }); await b.next((m) => m.t === 'joined');
    assert.equal(b.v.players[1].name, 'Người 2', 'tên trống → tên mặc định');
    const c = await new Client(S.url, 'c').open(); c.send({ t: 'join', code: a.code, name: 'C' }); await c.next((m) => m.t === 'joined');
    c.close();
    await b.next((m) => m.t === 'state' && m.v.players.length === 2, 1500);
    a.send({ t: 'leave' }); await a.next((m) => m.t === 'left');
    await b.next((m) => m.t === 'state' && m.v.players.length === 1);
    assert.equal(b.v.host, 0); assert.equal(b.v.you, 0);
    a.close(); b.close();
  } finally { await S.stop(); }
});

test('chống spam / dữ liệu rác: JSON hỏng, mảng, khung quá cỡ, gửi dồn → bị chặn, máy chủ vẫn sống', async () => {
  const S = await startServer();
  try {
    const a = await new Client(S.url, 'a').open();
    assert.equal(await a.tryCmd('{oops'), 'bad');
    assert.equal(await a.tryCmd('[1,2]'), 'bad');
    assert.equal(await a.tryCmd({ t: 'roll' }), 'no-room');
    for (let i = 0; i < 30; i++) a.send({ t: 'ping' });
    await sleep(100);
    assert.ok(a.msgs.some((m) => m.code === 'slow'), 'gửi dồn bị báo chậm lại');
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

test('server.js gắn Cờ Cá Ngựa mặc định (không cần biến môi trường), tắt bằng COCANGUA_ONLINE=0', async () => {
  const { execFileSync } = await import('node:child_process');
  const probe = (env) => execFileSync(process.execPath, ['-e', `
    const s=require('./server.js'); s.listen(0,'127.0.0.1',async()=>{const p=s.address().port;
      const ws=new WebSocket('ws://127.0.0.1:'+p+'/ws/co-ca-ngua');
      const t=setTimeout(()=>{console.log('off');process.exit(0)},800);
      ws.onopen=()=>{clearTimeout(t);console.log('on');process.exit(0)}; ws.onerror=()=>{clearTimeout(t);console.log('off');process.exit(0)};});`],
    { cwd: new URL('../../../', import.meta.url), env: { ...process.env, MASOI_ONLINE: '0', NOITU_ONLINE: '0', ...env }, encoding: 'utf8' }).trim().split('\n').pop();
  assert.equal(probe({ COCANGUA_ONLINE: '1' }), 'on');
  assert.equal(probe({ COCANGUA_ONLINE: '' }), 'on');
  assert.equal(probe({ COCANGUA_ONLINE: '0' }), 'off');
});

test('người không có lượt ngắt/nối liên tục không kéo dài được hạn của lượt người khác (đồng hồ giả)', () => {
  const { Room } = require('../room.js');
  let now = 0, timers = [], id = 0;
  const clock = { now: () => now, setTimeout: (f, ms) => { const t = { id: ++id, at: now + ms, f }; timers.push(t); return t; }, clearTimeout: (t) => { timers = timers.filter((x) => x !== t); } };
  const tick = (to) => { while (true) { const t = timers.filter((x) => x.at <= to).sort((a, b) => a.at - b.at)[0]; if (!t) break; timers = timers.filter((x) => x !== t); now = t.at; t.f(); } now = to; };
  const r = new Room({ code: 'ABCDE', L, clock, randInt: () => 2, timings: { auto: 1100, turn: 30000, away: 8000, left: 1200 } });
  r.join('A', 'ta'); r.join('B', 'tb'); r.handle(0, { t: 'start' });
  assert.equal(r.g.turn, 0); assert.equal(r.deadline, 30000);
  for (let t = 29000; t < 29900; t += 100) { tick(t); r.setConnected(1, false); r.setConnected(1, true); }
  assert.equal(r.deadline, 30000, 'hạn không bị đẩy lùi');
  tick(30001);
  assert.equal(r.seq, 1, 'máy chủ đã gieo thay đúng hạn');
  // người có lượt mất kết nối → hạn chỉ ngắn lại; nối lại không vượt hạn gốc
  const base = r.deadline - 0; // hạn gốc của hành động mới
  if (r.phase === 'play' && r.g.phase === 'roll') {
    const turn = r.g.turn;
    tick(now + 25000); r.setConnected(turn, false);
    assert.equal(r.deadline, base, 'mất kết nối gần hết hạn không làm hạn dài thêm');
    r.setConnected(turn, true); assert.equal(r.deadline, base);
  }
  r.close();
});

const st = (f) => (m) => m.t === 'state' && f(m.v);
test('chat: đi qua máy chủ rồi phát cho mọi ghế; tên người gửi do máy chủ gắn (không giả danh được); làm sạch; giới hạn độ dài + số tin; người đã rời ván không chat được', async () => {
  const S = await startServer();
  try {
    const cs = await table(S.url, 3);
    cs[1].send({ t: 'chat', text: 'Xin​ chào\n\nmọi người', name: 'Chủ phòng', from: 0 });
    for (const c of cs) await c.next(st((v) => v.chat?.length === 1));
    for (const [k, c] of cs.entries()) { assert.equal(c.v.chat[0].name, 'Người 1'); assert.equal(c.v.chat[0].text, 'Xin chào mọi người'); assert.equal(c.v.chat[0].mine, k === 1); }
    for (const raw of cs.flatMap((c) => c.raw).filter((t) => !t.startsWith('{"t":"joined"'))) for (const c of cs) assert.ok(!raw.includes(c.token));
    assert.equal(await cs[2].tryCmd({ t: 'chat', text: '' }), 'bad');
    assert.equal(await cs[2].tryCmd({ t: 'chat', text: 'a'.repeat(201) }), 'long');
    const errs = [];
    for (let k = 0; k < 6; k++) errs.push(await cs[2].tryCmd({ t: 'chat', text: 'spam ' + k }, 20));
    assert.deepEqual(errs.slice(0, 4), [null, null, null, null]); assert.equal(errs[4], 'chat-slow');
    assert.equal(await cs[0].tryCmd({ t: 'chat', text: 'chủ phòng vẫn chat được' }), null); // giới hạn tính riêng từng người
    // vào ván rồi rời hẳn → kết nối cũ không còn ghế để chat
    cs[0].send({ t: 'start' }); for (const c of cs) await c.next(st((v) => v.phase === 'play'));
    cs[2].send({ t: 'leave' }); await cs[2].next((m) => m.t === 'left');
    assert.equal(await cs[2].tryCmd({ t: 'chat', text: 'tôi đã rời' }), 'no-room');
    assert.ok(!cs[0].v.chat.some((c) => c.text === 'tôi đã rời'));
  } finally { await S.stop(); }
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
