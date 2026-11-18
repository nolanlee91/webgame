// Ma Sói — máy chủ thật + 6–8 người chơi qua WebSocket thật. Trọng tâm: giữ bí mật vai trò.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startServer, table, startGame, leaks, sleep, Client, FAST, allPhase } from './helpers.mjs';
const require = createRequire(import.meta.url);
const { Room, roleSet } = require('../room.js');

let S;
test.beforeEach(async () => { S = await startServer(); });
test.afterEach(async () => { await S.stop(); });

async function expandedGame(variant = 0) {
  const clients = await table(S.url, 8);
  S.host.rooms.get(clients[0].code).room.randInt = (n) => n === 6 ? variant : 0;
  return startGame(clients);
}

test('bộ vai: 6 → 2 Sói + Tiên tri + Bảo vệ + 2 Dân; 7 luân phiên, 8 có cả hai vai mới', () => {
  const count = (a) => a.reduce((o, r) => ((o[r] = (o[r] || 0) + 1), o), {});
  assert.deepEqual(count(roleSet(6)), { wolf: 2, seer: 1, guard: 1, villager: 2 });
  assert.deepEqual(count(roleSet(7)), { wolf: 2, seer: 1, guard: 1, villager: 2, hunter: 1 });
  assert.deepEqual(count(roleSet(7, 1)), { wolf: 2, seer: 1, guard: 1, villager: 2, witch: 1 });
  assert.deepEqual(count(roleSet(8)), { wolf: 2, seer: 1, guard: 1, villager: 2, hunter: 1, witch: 1 });
  assert.equal(new Set(Array.from({ length: 4 }, (_, i) => roleSet(7, i).at(-1))).size, 4);
  const pairs = Array.from({ length: 6 }, (_, i) => roleSet(8, i).slice(6));
  assert.equal(new Set(pairs.map((pair) => pair.join('/'))).size, 6);
  assert.deepEqual(pairs.at(-1), ['mayor', 'gatekeeper']);
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

test('Phù Thủy cứu một lần; chọn thuốc chỉ đổi góc nhìn của Phù Thủy', async () => {
  const g = await expandedGame();
  const witch = g.cs.find((c) => c.role === 'witch');
  const [victim, watcher] = g.villagers;
  const before = watcher.raw.length;
  const armed = witch.next((m) => m.t === 'state' && m.v.night?.armed);
  witch.send({ t: 'brew', enabled: true });
  await armed;
  assert.equal(await watcher.tryCmd({ t: 'brew', enabled: true }, 30), 'no-action');
  assert.equal(watcher.raw.slice(before).filter(({ text }) => JSON.parse(text).t === 'state').length, 0);
  g.wolves[0].send({ t: 'act', target: victim.v.seat });
  await allPhase(g.cs, 'dawn');
  assert.equal(victim.me.alive, true);
  assert.equal(watcher.v.events.at(-1).kind, 'peace');
  await allPhase(g.cs, 'vote');
  for (const c of g.cs) c.send({ t: 'vote', target: null });
  await allPhase(g.cs, 'night');
  assert.equal(witch.v.night.ready, false);
  assert.equal(await witch.tryCmd({ t: 'brew', enabled: true }), 'spent');
});

test('công bố bộ vai; Gác Cổng nhận báo cáo riêng và Trưởng Làng chỉ phân xử một lần', async () => {
  const g = await expandedGame(5);
  const keeper = g.cs.find((c) => c.role === 'gatekeeper');
  const mayor = g.cs.find((c) => c.role === 'mayor');
  const [observer, other] = g.villagers;
  assert.deepEqual(keeper.v.lineup, observer.v.lineup);
  assert.equal(observer.v.lineup.gatekeeper, 1);
  assert.equal(observer.v.players[keeper.v.seat].role, undefined);
  assert.equal(await observer.tryCmd({ t: 'watch', enabled: true }, 30), 'no-action');
  const armed = keeper.next((m) => m.t === 'state' && m.v.night?.armed);
  keeper.send({ t: 'watch', enabled: true });
  await armed;
  g.seer.send({ t: 'act', target: keeper.v.seat });
  await allPhase(g.cs, 'dawn');
  assert.deepEqual(keeper.v.gateReport, { round: 1, targeted: true });
  assert.ok(g.cs.filter((c) => c !== keeper).every((c) => !c.v.gateReport));
  await allPhase(g.cs, 'vote');
  // Bốn phiếu chia 2–2. Những người còn lại không bỏ phiếu, để hết giờ tự kiểm.
  mayor.send({ t: 'vote', target: observer.v.seat });
  other.send({ t: 'vote', target: observer.v.seat });
  observer.send({ t: 'vote', target: other.v.seat });
  keeper.send({ t: 'vote', target: other.v.seat });
  await allPhase(g.cs, 'night');
  assert.equal(observer.me.alive, false);
  assert.equal(other.v.events.at(-1).byMayor, true);
  assert.equal(other.me.alive, true);
  assert.equal(mayor.v.mayorReady, false);
  assert.equal(other.v.mayorReady, undefined);
  assert.equal(await keeper.tryCmd({ t: 'watch', enabled: true }, 30), 'spent');
  await allPhase(g.cs, 'vote');
  mayor.send({ t: 'vote', target: keeper.v.seat });
  other.send({ t: 'vote', target: keeper.v.seat });
  keeper.send({ t: 'vote', target: other.v.seat });
  g.seer.send({ t: 'vote', target: other.v.seat });
  await allPhase(g.cs, 'night');
  assert.equal(keeper.v.events.at(-1).kind, 'nohang');
});

test('Gác Cổng tính lần bảo vệ và chỉ tính mục tiêu cắn cuối cùng của bầy Sói', () => {
  for (const protectedByGuard of [false, true]) {
    const room = new Room({ code: 'WATCH', clock: { now: () => 0, setTimeout: () => 1, clearTimeout: () => {} }, randInt: (n) => n - 1 });
    for (let i = 0; i < 8; i++) room.join(`P${i}`, `T${i}`);
    room.handle(0, { t: 'start' });
    room._next();
    const keeper = room.players.find((p) => p.role === 'gatekeeper');
    const guard = room.players.find((p) => p.role === 'guard');
    const [wolf1, wolf2] = room.players.filter((p) => p.role === 'wolf');
    room.handle(keeper.seat, { t: 'watch', enabled: true });
    room.handle(wolf1.seat, { t: 'act', target: keeper.seat });
    room.handle(wolf2.seat, { t: 'act', target: guard.seat });
    if (protectedByGuard) room.handle(guard.seat, { t: 'act', target: keeper.seat });
    room._next();
    assert.equal(room.events.at(-1).seat, guard.seat);
    assert.equal(room.viewFor(keeper.seat).gateReport.targeted, protectedByGuard);
  }
});

test('Thợ Săn được chọn riêng ở bình minh hoặc lúc kiểm phiếu; xử lý trước khi xét thắng', () => {
  for (const phase of ['dawn', 'verdict']) {
    const room = new Room({ code: 'HUNT', clock: { now: () => 0, setTimeout: () => 1, clearTimeout: () => {} }, randInt: () => 0 });
    for (let i = 0; i < 8; i++) room.join(`P${i}`, `T${i}`);
    room.handle(0, { t: 'start' });
    room._next();
    const hunter = room.players.find((p) => p.role === 'hunter');
    const wolves = room.players.filter((p) => p.role === 'wolf');
    const villager = room.players.find((p) => p.role === 'villager');
    room._eliminate(wolves[1].seat, 'hang');
    if (phase === 'dawn') {
      room.handle(wolves[0].seat, { t: 'act', target: hunter.seat });
      room._next();
    } else {
      room._next(); room._next(); room._next();
      room.handle(villager.seat, { t: 'vote', target: hunter.seat });
      room._next();
    }
    assert.equal(room.phase, phase);
    assert.equal(room.endsAt, phase === 'dawn' ? 22000 : 21000);
    assert.equal(room.handle(villager.seat, { t: 'hunt', target: wolves[0].seat }).err, 'no-action');
    assert.equal(room.handle(hunter.seat, { t: 'hunt', target: hunter.seat }).err, 'target');
    assert.equal(room.handle(hunter.seat, { t: 'hunt', target: wolves[0].seat }).ok, true);
    assert.deepEqual(room.viewFor(hunter.seat).hunt, { target: wolves[0].seat });
    assert.equal(room.viewFor(villager.seat).hunt, undefined);
    assert.equal(wolves[0].alive, true);
    room._next();
    assert.equal(room.phase, 'end');
    assert.equal(room.winner, 'village');
    assert.deepEqual(room.events.at(-1), { round: 1, kind: 'hunt', seat: wolves[0].seat, role: 'wolf' });
    assert.equal(room.viewFor(hunter.seat).hunt, undefined);
  }
});

test('phát vai: mỗi người chỉ biết vai MÌNH; Sói thấy đúng đồng bọn; không ai thấy vai Tiên tri/Bảo vệ', async () => {
  const g = await expandedGame();
  const { cs } = g;
  assert.equal(g.wolves.length, 2); assert.ok(g.seer && g.guard); assert.equal(g.villagers.length, 2);
  assert.ok(cs.some((c) => c.role === "hunter") && cs.some((c) => c.role === "witch"));
  const wolfSeats = g.wolves.map((c) => c.v.seat);
  for (const c of cs) {
    const known = c.v.players.filter((p) => 'role' in p).map((p) => p.seat).sort();
    const expect = c.role === 'wolf' ? [...wolfSeats].sort() : [c.v.seat];
    assert.deepEqual(known, expect, `${c.name} (${c.role}) biết vai của: ${known}`);
  }
  for (const c of cs) assert.deepEqual(leaks(c, wolfSeats), []);
});

test('ban đêm: dân thường KHÔNG nhận gói tin nào khi Sói bàn/cắn, Tiên tri soi, Bảo vệ chọn (không lộ qua thời điểm gói tin)', async () => {
  const g = await startGame(await table(S.url, 6));
  const quiet = [...g.villagers];
  const n0 = quiet.map((c) => c.raw.length);
  const victim = g.villagers[0].v.seat;
  for (const w of g.wolves) { w.send({ t: 'chat', text: 'BIMATSOI cắn người này' }); w.send({ t: 'act', target: victim }); }
  g.seer.send({ t: 'act', target: g.wolves[0].v.seat });
  g.guard.send({ t: 'act', target: g.guard.v.seat });
  await sleep(150);
  assert.equal(S.host.rooms.size, 1);
  assert.equal(quiet.map((c) => c.raw.length).join(), n0.join(), 'dân thường nhận thêm gói tin ban đêm');
  for (const c of [...quiet, g.seer, g.guard]) assert.ok(!c.raw.some((r) => r.text.includes('BIMATSOI')), `${c.name} thấy chat Sói`);
  assert.ok(g.wolves.every((w) => w.v.wolfChat.some((m) => m.text.includes('BIMATSOI'))));
  assert.equal(g.wolves[0].v.night.pack[g.wolves[1].v.seat], victim, 'Sói thấy phiếu cắn của đồng bọn');
  assert.deepEqual(g.seer.v.seer.at(-1), { round: 1, target: g.wolves[0].v.seat, team: 'wolf' });
  assert.equal(g.seer.v.players[g.wolves[0].v.seat].role, undefined, 'soi chỉ ra PHE, không gửi vai');
});

test('pha đêm luôn chạy đủ thời gian dù mọi người đã chọn xong (không lộ ai còn sống/đã chọn)', async () => {
  const g = await startGame(await table(S.url, 6));
  const t0 = Date.now(), endsAt = g.cs[0].v.endsAt;
  for (const w of g.wolves) w.send({ t: 'act', target: g.villagers[0].v.seat });
  g.seer.send({ t: 'act', target: g.guard.v.seat }); g.guard.send({ t: 'act', target: g.seer.v.seat });
  await g.cs[0].waitPhase('dawn');
  assert.ok(Date.now() - t0 >= FAST.night - 60, `đêm kết thúc sớm sau ${Date.now() - t0} ms`);
  assert.ok(Math.abs(endsAt - (Date.now())) < 120);
});

test('lỗi trả về giống hệt nhau bất kể vai của mục tiêu (dân thường dò vai bằng lệnh act/vote không được gì)', async () => {
  const g = await startGame(await table(S.url, 6));
  const v = g.villagers[0];
  const errs = [];
  for (const c of g.cs) errs.push(await v.tryCmd({ t: 'act', target: c.v.seat }, 30));
  assert.deepEqual(new Set(errs), new Set(['no-action']));
  assert.equal(await v.tryCmd({ t: 'chat', text: 'ai là sói' }, 60), 'night', 'dân không chat được ban đêm');
  // Sói thử cắn đồng bọn ⇒ lỗi, nhưng chỉ Sói nhận (Sói vốn đã biết đồng bọn)
  assert.equal(await g.wolves[0].tryCmd({ t: 'act', target: g.wolves[1].v.seat }, 60), 'target');
  for (const bad of [{ t: 'act', target: '0' }, { t: 'act', target: 99 }, { t: 'vote', target: 0 }, { t: 'zzz' }, '[1]', 'không phải json'])
    assert.ok(await v.tryCmd(bad, 40), JSON.stringify(bad));
});

test('Bảo vệ chặn đúng người bị cắn ⇒ "đêm bình yên"; đêm sau không được bảo vệ lại người cũ', async () => {
  const g = await startGame(await table(S.url, 6));
  const target = g.villagers[0].v.seat;
  for (const w of g.wolves) w.send({ t: 'act', target });
  g.guard.send({ t: 'act', target });
  await g.cs[0].waitPhase('dawn');
  assert.deepEqual(g.cs[0].v.events.at(-1), { round: 1, kind: 'peace' });
  assert.ok(g.cs[0].v.players[target].alive);
  // ngày: mọi người bỏ qua ⇒ không treo ai
  await g.cs[0].waitPhase('vote');
  for (const c of g.cs) c.send({ t: 'vote', target: null });
  await allPhase(g.cs, 'night');
  assert.deepEqual(g.cs[0].v.events.at(-1), { round: 1, kind: 'nohang' });
  assert.equal(g.guard.v.night.banned, target);
  assert.equal(await g.guard.tryCmd({ t: 'act', target }, 60), 'same-guard');
});

test('Sói cắn trúng ⇒ người chết lộ vai cho mọi người; người chết không chat/bỏ phiếu/hành động', async () => {
  const g = await startGame(await table(S.url, 6));
  const dead = g.seer; // cắn Tiên tri
  for (const w of g.wolves) w.send({ t: 'act', target: dead.v.seat });
  await allPhase(g.cs, 'dawn');
  for (const c of g.cs) assert.equal(c.v.players[dead.v.seat].role, 'seer', `${c.name} phải thấy vai người chết`);
  assert.deepEqual(g.cs[1].v.events.at(-1), { round: 1, kind: 'bite', seat: dead.v.seat, role: 'seer' });
  await g.cs[0].waitPhase('day');
  assert.equal(await dead.tryCmd({ t: 'chat', text: 'tôi chết rồi' }, 60), 'dead');
  await g.cs[0].waitPhase('vote');
  assert.equal(await dead.tryCmd({ t: 'vote', target: g.wolves[0].v.seat }, 60), 'dead');
});

test('bỏ phiếu: công khai, tự bỏ phiếu mình bị chặn, hoà ⇒ không treo, đủ phiếu ⇒ chốt sớm', async () => {
  const g = await startGame(await table(S.url, 6));
  await g.cs[0].waitPhase('vote', 4000);
  const [a, b] = [g.villagers[0].v.seat, g.villagers[1].v.seat];
  assert.equal(await g.cs[a].tryCmd({ t: 'vote', target: a }, 40), 'target');
  // 3 phiếu a, 3 phiếu b ⇒ hoà
  g.cs.filter((c) => c.v.seat !== a && c.v.seat !== b).forEach((c, i) => c.send({ t: 'vote', target: i % 2 ? a : b }));
  g.cs[a].send({ t: 'vote', target: b }); g.cs[b].send({ t: 'vote', target: a });
  const t0 = Date.now();
  await allPhase(g.cs, 'verdict');
  assert.ok(Date.now() - t0 < FAST.vote, 'đủ phiếu phải chốt sớm');
  assert.equal(Object.keys(g.cs[2].v.votes).length, 6, 'ai cũng thấy phiếu (công khai)');
  assert.equal(g.cs[0].v.events.at(-1).kind, 'nohang');
});

test('chơi trọn ván tới khi có phe thắng; toàn bộ gói tin của từng người không lộ vai trái phép; hết ván lộ hết', async () => {
  const g = await startGame(await table(S.url, 6));
  const wolfSeats = g.wolves.map((c) => c.v.seat);
  // Dân treo Sói mỗi ngày (giả lập phân tích đúng), Sói cắn dân thường mỗi đêm
  for (let day = 0; day < 6 && g.cs[0].v.phase !== 'end'; day++) {
    const prey = g.cs.find((c) => c.me.alive && c.role !== 'wolf' && c !== g.guard);
    for (const w of g.wolves) if (w.me.alive) w.send({ t: 'act', target: prey.v.seat });
    g.seer.me.alive && g.seer.send({ t: 'act', target: wolfSeats[0] });
    await g.cs[0].next((m) => m.t === 'state' && ['vote', 'end'].includes(m.v.phase), 4000);
    if (g.cs[0].v.phase === 'end') break;
    const wolf = g.wolves.find((w) => w.me.alive);
    for (const c of g.cs) if (c.me.alive) c.send({ t: 'vote', target: c === wolf ? null : wolf.v.seat });
    await g.cs[0].next((m) => m.t === 'state' && ['night', 'end'].includes(m.v.phase), 4000);
  }
  await allPhase(g.cs, 'end');
  const v = g.cs[0].v;
  assert.equal(v.phase, 'end');
  assert.equal(v.winner, 'village');
  for (const c of g.cs) assert.ok(c.v.players.every((p) => p.role), 'hết ván: lộ hết vai');
  for (const c of g.cs) assert.deepEqual(leaks(c, wolfSeats), [], c.name);
});

test('Sói thắng khi số Sói ≥ số dân còn sống', async () => {
  const g = await startGame(await table(S.url, 6));
  for (let k = 0; k < 4 && g.cs[0].v.phase !== 'end'; k++) {
    const prey = g.cs.find((c) => c.me.alive && c.role !== 'wolf');
    for (const w of g.wolves) w.send({ t: 'act', target: prey.v.seat });
    await g.cs[0].next((m) => m.t === 'state' && ['vote', 'end'].includes(m.v.phase), 4000);
    if (g.cs[0].v.phase === 'end') break;
    const vil = g.cs.find((c) => c.me.alive && c.role !== 'wolf');
    for (const c of g.cs) if (c.me.alive) c.send({ t: 'vote', target: c === vil ? null : vil.v.seat });
    await g.cs[0].next((m) => m.t === 'state' && ['night', 'end'].includes(m.v.phase), 4000);
  }
  assert.equal(g.cs[0].v.winner, 'wolf');
});

test('rớt mạng giữa ván: vào lại bằng token ⇒ đúng ghế, đúng vai; token sai/khác phòng bị từ chối; tab cũ bị thay', async () => {
  const g = await startGame(await table(S.url, 6));
  const w = g.wolves[0], seat = w.v.seat;
  const re = await new Client(S.url, 're').open();
  re.send({ t: 'resume', code: w.code, token: w.token });
  await re.next((m) => m.t === 'state');
  assert.equal(re.v.seat, seat); assert.equal(re.role, 'wolf');
  assert.ok(w.msgs.some((m) => m.t === 'replaced'), 'tab cũ được báo bị thay');
  const bad = await new Client(S.url, 'bad').open();
  bad.send({ t: 'resume', code: w.code, token: '0'.repeat(32) });
  assert.equal((await bad.next((m) => m.t === 'err')).code, 'no-seat');
  const bad2 = await new Client(S.url, 'bad2').open();
  bad2.send({ t: 'resume', code: w.code, token: g.villagers[0].token.toUpperCase() });
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
    const q = http.request({ port, path: '/ws/ma-soi', headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==', 'Sec-WebSocket-Version': '13', Origin: 'https://ke-gian.example' } });
    q.on('response', (res) => r(res.statusCode)); q.on('upgrade', () => r(101)); q.end();
  });
  assert.equal(code, 403);
});

test('chủ phòng chơi lại ⇒ về phòng chờ, xoá vai cũ; người rời phòng chờ quá hạn bị xoá ghế', async () => {
  const room = new Room({ code: 'T', timings: { reveal: 0 }, clock: { now: () => 0, setTimeout: () => 1, clearTimeout: () => {} }, randInt: () => 0 });
  for (let i = 0; i < 6; i++) room.join(`N${i}`, `t${i}`);
  room._start(0); room.phase = 'end'; room.winner = 'wolf';
  Object.assign(room, { lastGuard: 1, witchUsed: true, mayorUsed: true, gateReport: { targeted: true }, hunt: { seat: 1, target: 2 } });
  room.players[5].connected = false;
  assert.deepEqual(room.handle(1, { t: 'again' }), { err: 'not-host' });
  assert.ok(room.handle(0, { t: 'again' }).ok);
  assert.equal(room.phase, 'lobby'); assert.equal(room.players.length, 5);
  assert.ok(room.players.every((p) => p.role === null));
  assert.ok(room.viewFor(1).players.every((p) => !('role' in p)));
  assert.deepEqual([room.lastGuard, room.witchUsed, room.mayorUsed, room.gateReport, room.hunt], [null, false, false, null, null]);
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
      const q = http.request({ port, host: '127.0.0.1', path: '/ws/ma-soi', headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==', 'Sec-WebSocket-Version': '13', 'X-Forwarded-For': xff } });
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
