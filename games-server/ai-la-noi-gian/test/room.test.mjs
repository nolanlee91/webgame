// Ai Là Nội Gián — máy chủ thật + 6–8 người chơi qua WebSocket thật. Trọng tâm: giữ bí mật vai trò.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startServer, table, startGame, leaks, sleep, Client, FAST, allPhase } from './helpers.mjs';
const require = createRequire(import.meta.url);
const { Room, roleSet } = require('../room.js');

let S;
test.beforeEach(async () => { S = await startServer(); });
test.afterEach(async () => { await S.stop(); });

test('bộ vai: 6 → 2 Nội Gián + Hacker Mật + Kỹ Sư An Ninh + 2 Đặc Vụ; 8 → 4 Đặc Vụ', () => {
  const count = (a) => a.reduce((o, r) => ((o[r] = (o[r] || 0) + 1), o), {});
  assert.deepEqual(count(roleSet(6)), { mole: 2, hacker: 1, security: 1, agent: 2 });
  assert.deepEqual(count(roleSet(8)), { mole: 2, hacker: 1, security: 1, agent: 4 });
});

test('phòng chờ: mã phòng, tên trùng/rỗng bị từ chối, chưa đủ 6 thì không bắt đầu, chỉ chủ phòng bắt đầu, tối đa 8', async () => {
  const cs = await table(S.url, 5);
  assert.match(cs[0].code, /^[A-Z2-9]{5}$/);
  assert.equal(cs[4].v.players.length, 5);
  assert.ok(cs[4].v.players.every((p) => !('role' in p)), 'phòng chờ chưa ai có vai');
  assert.equal(await cs[0].tryCmd({ t: 'start' }), 'need-players');
  const x = await new Client(S.url, 'x').open();
  x.send({ t: 'join', code: cs[0].code, name: ' người 1 ' }); assert.equal((await x.next((m) => m.t === 'err')).code, 'name-taken');
  const y = await new Client(S.url, 'y').open();
  y.send({ t: 'join', code: cs[0].code, name: '​ ‮ ' }); assert.equal((await y.next((m) => m.t === 'err')).code, 'name');
  const z = await new Client(S.url, 'z').open();
  z.send({ t: 'join', code: 'ZZZZZ', name: 'A' }); assert.equal((await z.next((m) => m.t === 'err')).code, 'no-room');
  const more = [];
  for (let i = 0; i < 4; i++) { const c = await new Client(S.url, `m${i}`).open(); c.send({ t: 'join', code: cs[0].code, name: `Thêm ${i}` }); more.push(c); }
  await sleep(100);
  assert.ok(more.slice(0, 3).every((c) => c.msgs.some((m) => m.t === 'joined')));
  assert.equal(more[3].msgs.find((m) => m.t === 'err')?.code, 'full');
  assert.equal(await cs[3].tryCmd({ t: 'start' }), 'not-host');
});

test('phát vai: mỗi người chỉ biết vai MÌNH; Nội Gián thấy đúng đồng bọn; không ai thấy vai Hacker Mật/Kỹ Sư An Ninh', async () => {
  const cs = await table(S.url, 8);
  const g = await startGame(cs);
  assert.equal(g.moles.length, 2); assert.ok(g.hacker && g.security); assert.equal(g.agents.length, 4);
  const moleSeats = g.moles.map((c) => c.v.seat);
  for (const c of cs) {
    const known = c.v.players.filter((p) => 'role' in p).map((p) => p.seat).sort();
    const expect = c.role === 'mole' ? [...moleSeats].sort() : [c.v.seat];
    assert.deepEqual(known, expect, `${c.name} (${c.role}) biết vai của: ${known}`);
  }
  for (const c of cs) assert.deepEqual(leaks(c, moleSeats), []);
});

test('ban đêm: Đặc Vụ thường KHÔNG nhận gói tin nào khi Nội Gián bàn/phá hoại, Hacker Mật quét, Kỹ Sư An Ninh chọn (không lộ qua thời điểm gói tin)', async () => {
  const g = await startGame(await table(S.url, 6));
  const quiet = [...g.agents];
  const n0 = quiet.map((c) => c.raw.length);
  const victim = g.agents[0].v.seat;
  for (const w of g.moles) { w.send({ t: 'chat', text: 'BIMATNOIGIAN phá hoại người này' }); w.send({ t: 'act', target: victim }); }
  g.hacker.send({ t: 'act', target: g.moles[0].v.seat });
  g.security.send({ t: 'act', target: g.security.v.seat });
  await sleep(150);
  assert.equal(S.host.rooms.size, 1);
  assert.equal(quiet.map((c) => c.raw.length).join(), n0.join(), 'Đặc Vụ thường nhận thêm gói tin ban đêm');
  for (const c of [...quiet, g.hacker, g.security]) assert.ok(!c.raw.some((r) => r.text.includes('BIMATNOIGIAN')), `${c.name} thấy chat Nội Gián`);
  assert.ok(g.moles.every((w) => w.v.moleChat.some((m) => m.text.includes('BIMATNOIGIAN'))));
  assert.equal(g.moles[0].v.night.pack[g.moles[1].v.seat], victim, 'Nội Gián thấy phiếu phá hoại của đồng bọn');
  assert.deepEqual(g.hacker.v.scan.at(-1), { round: 1, target: g.moles[0].v.seat, team: 'mole' });
  assert.equal(g.hacker.v.players[g.moles[0].v.seat].role, undefined, 'soi chỉ ra PHE, không gửi vai');
});

test('pha đêm luôn chạy đủ thời gian dù mọi người đã chọn xong (không lộ ai còn sống/đã chọn)', async () => {
  const g = await startGame(await table(S.url, 6));
  const t0 = Date.now(), endsAt = g.cs[0].v.endsAt;
  for (const w of g.moles) w.send({ t: 'act', target: g.agents[0].v.seat });
  g.hacker.send({ t: 'act', target: g.security.v.seat }); g.security.send({ t: 'act', target: g.hacker.v.seat });
  await g.cs[0].waitPhase('dawn');
  assert.ok(Date.now() - t0 >= FAST.night - 60, `đêm kết thúc sớm sau ${Date.now() - t0} ms`);
  assert.ok(Math.abs(endsAt - (Date.now())) < 120);
});

test('lỗi trả về giống hệt nhau bất kể vai của mục tiêu (Đặc Vụ thường dò vai bằng lệnh act/vote không được gì)', async () => {
  const g = await startGame(await table(S.url, 6));
  const v = g.agents[0];
  const errs = [];
  for (const c of g.cs) errs.push(await v.tryCmd({ t: 'act', target: c.v.seat }, 30));
  assert.deepEqual(new Set(errs), new Set(['no-action']));
  assert.equal(await v.tryCmd({ t: 'chat', text: 'ai là sói' }, 60), 'night', 'dân không chat được ban đêm');
  // Nội Gián thử phá hoại đồng bọn ⇒ lỗi, nhưng chỉ Nội Gián nhận (Nội Gián vốn đã biết đồng bọn)
  assert.equal(await g.moles[0].tryCmd({ t: 'act', target: g.moles[1].v.seat }, 60), 'target');
  for (const bad of [{ t: 'act', target: '0' }, { t: 'act', target: 99 }, { t: 'vote', target: 0 }, { t: 'zzz' }, '[1]', 'không phải json'])
    assert.ok(await v.tryCmd(bad, 40), JSON.stringify(bad));
});

test('Kỹ Sư An Ninh chặn đúng người bị phá hoại ⇒ "an toàn"; đêm sau không được bảo vệ lại người cũ', async () => {
  const g = await startGame(await table(S.url, 6));
  const target = g.agents[0].v.seat;
  for (const w of g.moles) w.send({ t: 'act', target });
  g.security.send({ t: 'act', target });
  await g.cs[0].waitPhase('dawn');
  assert.deepEqual(g.cs[0].v.events.at(-1), { round: 1, kind: 'safe' });
  assert.ok(g.cs[0].v.players[target].alive);
  // ngày: mọi người bỏ qua ⇒ không bắt giữ ai
  await g.cs[0].waitPhase('vote');
  for (const c of g.cs) c.send({ t: 'vote', target: null });
  await allPhase(g.cs, 'night');
  assert.deepEqual(g.cs[0].v.events.at(-1), { round: 1, kind: 'nojail' });
  assert.equal(g.security.v.night.banned, target);
  assert.equal(await g.security.tryCmd({ t: 'act', target }, 60), 'same-shield');
});

test('Nội Gián phá hoại trúng ⇒ người chết lộ vai cho mọi người; người chết không chat/bỏ phiếu/hành động', async () => {
  const g = await startGame(await table(S.url, 6));
  const dead = g.hacker; // phá hoại Hacker Mật
  for (const w of g.moles) w.send({ t: 'act', target: dead.v.seat });
  await allPhase(g.cs, 'dawn');
  for (const c of g.cs) assert.equal(c.v.players[dead.v.seat].role, 'hacker', `${c.name} phải thấy vai người chết`);
  assert.deepEqual(g.cs[1].v.events.at(-1), { round: 1, kind: 'hit', seat: dead.v.seat, role: 'hacker' });
  await g.cs[0].waitPhase('day');
  assert.equal(await dead.tryCmd({ t: 'chat', text: 'tôi chết rồi' }, 60), 'dead');
  await g.cs[0].waitPhase('vote');
  assert.equal(await dead.tryCmd({ t: 'vote', target: g.moles[0].v.seat }, 60), 'dead');
});

test('bỏ phiếu: công khai, tự bỏ phiếu mình bị chặn, hoà ⇒ không bắt giữ, đủ phiếu ⇒ chốt sớm', async () => {
  const g = await startGame(await table(S.url, 6));
  await g.cs[0].waitPhase('vote', 4000);
  const [a, b] = [g.agents[0].v.seat, g.agents[1].v.seat];
  assert.equal(await g.cs[a].tryCmd({ t: 'vote', target: a }, 40), 'target');
  // 3 phiếu a, 3 phiếu b ⇒ hoà
  g.cs.filter((c) => c.v.seat !== a && c.v.seat !== b).forEach((c, i) => c.send({ t: 'vote', target: i % 2 ? a : b }));
  g.cs[a].send({ t: 'vote', target: b }); g.cs[b].send({ t: 'vote', target: a });
  const t0 = Date.now();
  await allPhase(g.cs, 'verdict');
  assert.ok(Date.now() - t0 < FAST.vote, 'đủ phiếu phải chốt sớm');
  assert.equal(Object.keys(g.cs[2].v.votes).length, 6, 'ai cũng thấy phiếu (công khai)');
  assert.equal(g.cs[0].v.events.at(-1).kind, 'nojail');
});

test('chơi trọn ván tới khi có phe thắng; toàn bộ gói tin của từng người không lộ vai trái phép; hết ván lộ hết', async () => {
  const g = await startGame(await table(S.url, 6));
  const moleSeats = g.moles.map((c) => c.v.seat);
  // Đặc Vụ bắt Nội Gián mỗi ngày (giả lập phân tích đúng), Nội Gián phá hoại Đặc Vụ thường mỗi đêm
  for (let day = 0; day < 6 && g.cs[0].v.phase !== 'end'; day++) {
    const prey = g.cs.find((c) => c.me.alive && c.role !== 'mole' && c !== g.security);
    for (const w of g.moles) if (w.me.alive) w.send({ t: 'act', target: prey.v.seat });
    g.hacker.me.alive && g.hacker.send({ t: 'act', target: moleSeats[0] });
    await g.cs[0].next((m) => m.t === 'state' && ['vote', 'end'].includes(m.v.phase), 4000);
    if (g.cs[0].v.phase === 'end') break;
    const mole = g.moles.find((w) => w.me.alive);
    for (const c of g.cs) if (c.me.alive) c.send({ t: 'vote', target: c === mole ? null : mole.v.seat });
    await g.cs[0].next((m) => m.t === 'state' && ['night', 'end'].includes(m.v.phase), 4000);
  }
  await allPhase(g.cs, 'end');
  const v = g.cs[0].v;
  assert.equal(v.phase, 'end');
  assert.equal(v.winner, 'agency');
  for (const c of g.cs) assert.ok(c.v.players.every((p) => p.role), 'hết ván: lộ hết vai');
  for (const c of g.cs) assert.deepEqual(leaks(c, moleSeats), [], c.name);
});

test('Nội Gián thắng khi số Nội Gián ≥ số Đặc Vụ còn sống', async () => {
  const g = await startGame(await table(S.url, 6));
  for (let k = 0; k < 4 && g.cs[0].v.phase !== 'end'; k++) {
    const prey = g.cs.find((c) => c.me.alive && c.role !== 'mole');
    for (const w of g.moles) w.send({ t: 'act', target: prey.v.seat });
    await g.cs[0].next((m) => m.t === 'state' && ['vote', 'end'].includes(m.v.phase), 4000);
    if (g.cs[0].v.phase === 'end') break;
    const vil = g.cs.find((c) => c.me.alive && c.role !== 'mole');
    for (const c of g.cs) if (c.me.alive) c.send({ t: 'vote', target: c === vil ? null : vil.v.seat });
    await g.cs[0].next((m) => m.t === 'state' && ['night', 'end'].includes(m.v.phase), 4000);
  }
  assert.equal(g.cs[0].v.winner, 'mole');
});

test('rớt mạng giữa ván: vào lại bằng token ⇒ đúng ghế, đúng vai; token sai/khác phòng bị từ chối; tab cũ bị thay', async () => {
  const g = await startGame(await table(S.url, 6));
  const w = g.moles[0], seat = w.v.seat;
  const re = await new Client(S.url, 're').open();
  re.send({ t: 'resume', code: w.code, token: w.token });
  await re.next((m) => m.t === 'state');
  assert.equal(re.v.seat, seat); assert.equal(re.role, 'mole');
  assert.ok(w.msgs.some((m) => m.t === 'replaced'), 'tab cũ được báo bị thay');
  const bad = await new Client(S.url, 'bad').open();
  bad.send({ t: 'resume', code: w.code, token: '0'.repeat(32) });
  assert.equal((await bad.next((m) => m.t === 'err')).code, 'no-seat');
  const bad2 = await new Client(S.url, 'bad2').open();
  bad2.send({ t: 'resume', code: w.code, token: g.agents[0].token.toUpperCase() });
  assert.equal((await bad2.next((m) => m.t === 'err')).code, 'no-seat');
  // không vào thêm được khi đã bắt đầu
  const late = await new Client(S.url, 'late').open();
  late.send({ t: 'join', code: w.code, name: 'Muộn' });
  assert.equal((await late.next((m) => m.t === 'err')).code, 'started');
});

test('chống phá: lệnh dồn dập bị chặn, khung quá cỡ bị đóng, trang web lạ (Origin khác) không kết nối được', async () => {
  const c = await new Client(S.url, 'spam').open();
  for (let i = 0; i < 30; i++) c.send({ t: 'ping' });
  await sleep(150);
  assert.ok(c.msgs.some((m) => m.code === 'slow'));
  const big = await new Client(S.url, 'big').open();
  const closed = new Promise((r) => (big.ws.onclose = (e) => r(e.code)));
  big.send({ t: 'chat', text: 'x'.repeat(5000) });
  assert.equal(await closed, 1009);
  const http = await import('node:http');
  const port = new URL(S.url).port;
  const code = await new Promise((r) => {
    const q = http.request({ port, path: '/ws/ai-la-noi-gian', headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==', 'Sec-WebSocket-Version': '13', Origin: 'https://ke-gian.example' } });
    q.on('response', (res) => r(res.statusCode)); q.on('upgrade', () => r(101)); q.end();
  });
  assert.equal(code, 403);
});

test('chủ phòng chơi lại ⇒ về phòng chờ, xoá vai cũ; người rời phòng chờ quá hạn bị xoá ghế', async () => {
  const room = new Room({ code: 'T', timings: { reveal: 0 }, clock: { now: () => 0, setTimeout: () => 1, clearTimeout: () => {} }, randInt: () => 0 });
  for (let i = 0; i < 6; i++) room.join(`N${i}`, `t${i}`);
  room._start(0); room.phase = 'end'; room.winner = 'mole';
  room.players[5].connected = false;
  assert.deepEqual(room.handle(1, { t: 'again' }), { err: 'not-host' });
  assert.ok(room.handle(0, { t: 'again' }).ok);
  assert.equal(room.phase, 'lobby'); assert.equal(room.players.length, 5);
  assert.ok(room.players.every((p) => p.role === null));
  assert.ok(room.viewFor(1).players.every((p) => !('role' in p)));
});

// ---- tầng kết nối: khung WebSocket thô (mảnh rỗng, dồn khung) + hạn mức theo IP ----
async function rawWs(url) {
  const net = await import('node:net');
  const u = new URL(url);
  const s = net.connect(+u.port, u.hostname);
  await new Promise((r) => s.once('connect', r));
  s.write(`GET ${u.pathname} HTTP/1.1\r\nHost: ${u.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n`);
  await new Promise((r) => s.once('data', r));
  const closed = new Promise((r) => { let code = null; s.on('data', (d) => { const i = d.indexOf(0x88); if (i >= 0 && code === null) code = d.readUInt16BE(i + 2); }); s.on('close', () => r(code)); });
  const frame = (fin, op, payload = Buffer.alloc(0)) => { const m = Buffer.from([1, 2, 3, 4]); const p = Buffer.from(payload).map((b, i) => b ^ m[i & 3]); return Buffer.concat([Buffer.from([(fin ? 0x80 : 0) | op, 0x80 | p.length]), m, p]); };
  return { s, closed, frame };
}

test('kết nối: mảnh rỗng vô hạn bị đóng; dồn khung (kể cả ping) bị đóng; khung điều khiển phân mảnh bị từ chối', async () => {
  const S2 = await startServer();
  try {
    const a = await rawWs(S2.url);
    a.s.write(a.frame(false, 0x1, '{"t":'));
    for (let i = 0; i < 30; i++) a.s.write(a.frame(false, 0x0));
    assert.equal(await a.closed, 1009);

    const b = await rawWs(S2.url);
    b.s.write(Buffer.concat(Array.from({ length: 200 }, () => b.frame(true, 0x9))));
    assert.equal(await b.closed, 1008);

    const c = await rawWs(S2.url);
    c.s.write(c.frame(false, 0x9, 'x'));
    assert.equal(await c.closed, 1002);
  } finally { await S2.stop(); }
});

test('hạn mức theo IP: tối đa N kết nối và N phòng đang mở từ một máy', async () => {
  const S2 = await startServer({ maxConnsPerIp: 4, maxRoomsPerIp: 2 });
  try {
    const cs = [];
    for (let i = 0; i < 4; i++) cs.push(await new Client(S2.url, `c${i}`).open());
    const extra = await new Client(S2.url, 'thừa').open();
    const code = await new Promise((r) => (extra.ws.onclose = (e) => r(e.code)));
    assert.equal(code, 1008);
    assert.ok(extra.msgs.some((m) => m.code === 'busy'));
    assert.equal(await cs[0].tryCmd({ t: 'create', name: 'A' }), null);
    assert.equal(await cs[1].tryCmd({ t: 'create', name: 'B' }), null);
    assert.equal(await cs[2].tryCmd({ t: 'create', name: 'C' }), 'busy');
    // đóng một kết nối ⇒ trả lại suất
    cs[3].close(); await sleep(100);
    const again = await new Client(S2.url, 'lại').open();
    assert.equal(await again.tryCmd({ t: 'ping' }), null);
  } finally { await S2.stop(); }
});

test('tin proxy: chỉ dùng IP do proxy gần nhất ghi (cuối X-Forwarded-For), client tự đặt header không né được hạn mức', async () => {
  const S2 = await startServer({ trustProxy: true, maxConnsPerIp: 2 });
  try {
    const port = new URL(S2.url).port;
    const http = await import('node:http');
    const open = (xff) => new Promise((r) => {
      const q = http.request({ port, host: '127.0.0.1', path: '/ws/ai-la-noi-gian', headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==', 'Sec-WebSocket-Version': '13', 'X-Forwarded-For': xff } });
      q.on('upgrade', (res, sock, head) => { let got = head.toString('latin1'); sock.on('data', (d) => (got += d.toString('latin1'))); sock.on('close', () => r(got.includes('busy') ? 'busy' : 'closed')); setTimeout(() => r('open'), 200); });
      q.end();
    });
    // client tự đặt IP đầu khác nhau, proxy (giả lập) luôn nối thêm IP thật 203.0.113.9 ở cuối
    assert.equal(await open('198.51.100.1, 203.0.113.9'), 'open');
    assert.equal(await open('198.51.100.2, 203.0.113.9'), 'open');
    assert.equal(await open('198.51.100.3, 203.0.113.9'), 'busy');
    assert.equal(await open('203.0.113.10'), 'open');
  } finally { await S2.stop(); }
});

test('khung có bit RSV (extension chưa thương lượng) bị đóng 1002', async () => {
  const S2 = await startServer();
  try {
    const a = await rawWs(S2.url);
    const f = a.frame(true, 0x1, '{}'); f[0] |= 0x40;
    a.s.write(f);
    assert.equal(await a.closed, 1002);
  } finally { await S2.stop(); }
});

test('chống spam chat: mỗi người dồn tối đa 5 tin rồi bị chặn "chat-slow"; người khác vẫn chat được', async () => {
  const cs = await table(S.url, 3);
  const codes = [];
  for (let i = 0; i < 7; i++) codes.push(await cs[0].tryCmd({ t: 'chat', text: `spam ${i}` }, 40));
  assert.equal(codes.filter((c) => c === 'chat-slow').length, 2, JSON.stringify(codes));
  assert.equal(await cs[1].tryCmd({ t: 'chat', text: 'xin chào' }, 40), null);
  await sleep(150);
  assert.equal(cs[2].v.chat.filter((c) => c.text.startsWith('spam')).length, 5);
});

// ---------- bot lấp ghế (để một người cũng chơi thử trọn ván) ----------
test('bot: chỉ chủ phòng thêm/bớt, chỉ trong phòng chờ, tối đa 8, không bớt được người thật; không ai "resume" vào ghế bot', async () => {
  const [h, p] = await table(S.url, 2);
  assert.equal(await p.tryCmd({ t: 'add-bot' }), 'not-host');
  for (let i = 0; i < 6; i++) assert.equal(await h.tryCmd({ t: 'add-bot' }, 60), null);
  assert.equal(h.v.players.length, 8);
  assert.ok(h.v.players.slice(2).every((x) => x.bot && /^Bot /.test(x.name)));
  assert.equal(new Set(h.v.players.map((x) => x.name)).size, 8, 'tên bot không trùng');
  assert.equal(await h.tryCmd({ t: 'add-bot' }), 'full');
  assert.equal(await h.tryCmd({ t: 'kick-bot', target: 1 }), 'target', 'không được đá người thật bằng kick-bot');
  assert.equal(await p.tryCmd({ t: 'kick-bot', target: 7 }), 'not-host');
  assert.equal(await h.tryCmd({ t: 'kick-bot', target: 7 }), null);
  assert.equal(h.v.players.length, 7);
  for (const tok of ['bot-1', 'bot-2', 'bot-7']) {
    const c = await new Client(S.url, 'X').open();
    c.send({ t: 'resume', code: h.code, token: tok });
    const m = await c.next((x) => x.t === 'err' || x.t === 'joined');
    assert.equal(m.t, 'err', `resume bằng ${tok} phải bị từ chối`); c.close();
  }
  h.send({ t: 'start' });
  await h.waitPhase('reveal');
  assert.equal(await h.tryCmd({ t: 'add-bot' }), 'phase');
  [h, p].forEach((c) => c.close());
});

test('bot: 1 người + 5 bot chơi TRỌN ván tới khi có phe thắng; người thật không thấy vai bot trái phép', async () => {
  const [h] = await table(S.url, 1);
  for (let i = 0; i < 5; i++) await h.tryCmd({ t: 'add-bot' }, 40);
  h.send({ t: 'start' });
  await h.waitPhase('night');
  const phases = new Set();
  // người thật luôn hành động/bỏ phiếu ngẫu nhiên hợp lệ để ván chạy
  for (let guard = 0; guard < 60 && h.v.phase !== 'end'; guard++) {
    const ph = h.v.phase; phases.add(ph);
    const others = h.v.players.filter((x) => x.alive && x.seat !== h.v.seat);
    if (ph === 'night' && h.v.night?.can && h.me.alive) {
      const t = h.v.night.can === 'sabotage' ? others.find((x) => x.role !== 'mole') : others[0];
      if (t) h.send({ t: 'act', target: t.seat });
    }
    if (ph === 'vote' && h.me.alive) h.send({ t: 'vote', target: others[0]?.seat ?? null });
    await h.next((m) => m.t === 'state' && m.v.phase !== ph, 4000);
  }
  assert.equal(h.v.phase, 'end', 'ván phải kết thúc');
  for (const ph of ['night', 'dawn', 'day', 'vote']) assert.ok(phases.has(ph) || h.v.round <= 1, `đã qua pha ${ph}`);
  assert.ok(['mole', 'agency'].includes(h.v.winner));
  assert.ok(h.v.players.every((x) => x.role), 'hết ván lộ hết vai');
  const moleSeats = h.v.players.filter((x) => x.role === 'mole').map((x) => x.seat);
  assert.deepEqual(leaks(h, moleSeats), []);
  // bot có nói chuyện ban ngày + bỏ phiếu công khai
  assert.ok(h.msgs.some((m) => m.t === 'state' && m.v.votes && Object.keys(m.v.votes).length > 0), 'bot có bỏ phiếu');
  h.close();
});

test('bot: chủ phòng chơi lại ⇒ bot vẫn ngồi trong phòng chờ; chủ phòng rời ⇒ chỉ còn bot thì phòng đóng', async () => {
  const [h, p] = await table(S.url, 2);
  for (let i = 0; i < 4; i++) await h.tryCmd({ t: 'add-bot' }, 40);
  h.close(); await sleep(450); // quá lobbyGrace ⇒ ghế chủ phòng bị xoá, p làm chủ
  assert.equal(p.v.host, p.v.seat, 'người thật còn lại làm chủ phòng (không bao giờ là bot)');
  p.close(); await sleep(450);
  assert.equal(S.host.rooms.size, 0, 'chỉ còn bot ⇒ phòng đóng, không để phòng mồ côi');
});

// Hồi quy (Codex review): rớt mạng 2 lần liên tiếp trong phòng chờ — hẹn giờ của lần rớt ĐẦU không được xoá ghế trước hạn của lần rớt SAU.
test('phòng chờ: rớt mạng 2 lần liên tiếp ⇒ hẹn giờ cũ bị huỷ, chỉ hạn mới tính; quá hạn mới thì mới mất ghế', async () => {
  const GRACE = 300; // lobbyGraceMs trong helpers
  const host = await new Client(S.url, 'host').open();
  host.send({ t: 'create', name: 'Chủ' });
  await host.next((m) => m.t === 'joined');
  const p = await new Client(S.url, 'p').open();
  p.send({ t: 'join', code: host.code, name: 'Rớt' });
  await p.next((m) => m.t === 'joined');
  const token = p.token, code = host.code;
  const closeOf = (c) => new Promise((r) => { c.ws.onclose = r; c.ws.close(); });
  const resume = async (name) => {
    const c = await new Client(S.url, name).open();
    c.send({ t: 'resume', code, token });
    return { c, m: await c.next((m) => m.t === 'joined' || m.t === 'err') };
  };
  await closeOf(p);                      // rớt lần 1 ⇒ hẹn giờ A (hết hạn ở ~GRACE)
  await sleep(GRACE * 0.4);
  let r = await resume('p2');            // vào lại kịp
  assert.equal(r.m.t, 'joined');
  await sleep(GRACE * 0.2);
  await closeOf(r.c);                    // rớt lần 2 ⇒ hẹn giờ B (hết hạn ở ~1.6·GRACE)
  await sleep(GRACE * 0.6);              // giờ đã qua hạn của A, chưa tới hạn B
  r = await resume('p3');
  assert.equal(r.m.t, 'joined', 'hẹn giờ cũ không được loại người đang trong hạn mới (trước đây nhận "no-seat")');
  await host.next((m) => m.t === 'state' && m.v.players.length === 2);
  // rớt lần 3 rồi không quay lại ⇒ quá hạn thì mất ghế thật
  await closeOf(r.c);
  await sleep(GRACE + 150);
  r = await resume('p4');
  assert.equal(r.m.t, 'err'); assert.equal(r.m.code, 'no-seat');
  assert.equal(host.v.players.length, 1);
});
