// Ma Sói: chat kênh Sói ban đêm qua bộ lọc tục + chuyển chủ phòng khi chủ phòng rời giữa ván (PTY-03).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Room } = require('../room.js');

const clock = { now: () => 1_000_000, setTimeout: () => 0, clearTimeout: () => {} };
function table(n = 6) {
  const r = new Room({ code: 'ABCDE', clock, randInt: () => 0, timings: {} });
  for (let i = 0; i < n; i++) r.join(`Người ${i}`, `t${i}`);
  return r;
}

test('kênh Sói ban đêm cũng che từ tục', () => {
  const r = table();
  assert.ok(r.handle(0, { t: 'start' }).ok);
  r.phase = 'night';
  const wolf = r.players.find((p) => p.role === 'wolf');
  assert.ok(r.handle(wolf.seat, { t: 'chat', text: 'cắn thằng vcl kia' }).ok);
  assert.equal(r.wolfChat.at(-1).text, 'cắn thằng *** kia');
});

test('PTY-03: chủ phòng mất kết nối giữa ván ⇒ người còn lại cầm phòng, hết ván bấm "Chơi ván mới" được', () => {
  const r = table();
  assert.ok(r.handle(0, { t: 'start' }).ok);
  r.setConnected(0, false);
  assert.equal(r.host, 1, 'chủ phòng chuyển cho người thật đầu tiên còn kết nối');
  r.phase = 'end';
  assert.equal(r.handle(2, { t: 'again' }).err, 'not-host');
  assert.ok(r.handle(1, { t: 'again' }).ok);
  assert.equal(r.phase, 'lobby');
  assert.equal(r.players.length, 5, 'người đã rời bị bỏ khỏi phòng chờ mới');
  assert.equal(r.players[r.host].name, 'Người 1');
});

test('PTY-03: chủ phòng đi khi không còn ai kết nối, người quay lại trước sẽ cầm phòng; chủ phòng vắng ⇒ ai cũng mở ván mới', () => {
  const r = table();
  assert.ok(r.handle(0, { t: 'start' }).ok);
  for (let i = 1; i < 6; i++) r.setConnected(i, false);
  r.setConnected(0, false);
  assert.equal(r.host, 0, 'không còn ai để chuyển');
  r.setConnected(3, true);
  assert.equal(r.host, 3, 'người quay lại cầm phòng vì chủ phòng đang vắng');
  r.host = 0; // giả lập trạng thái cũ: chủ phòng vắng
  r.phase = 'end';
  assert.ok(r.handle(3, { t: 'again' }).ok);
});
