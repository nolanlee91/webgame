// LocalSession = MatchClient + RefereeHost chạy cùng trang, nối bằng transport trong bộ nhớ.
// Mọi thông điệp vẫn đi qua JSON (giống mạng thật) ⇒ UI dùng đúng một đường code cho offline và online.
import { RefereeHost } from './referee.js';
import { MatchClient } from './client.js';
import { realScheduler } from './scheduler.js';
import { pinOf } from '../core/rules.js';

/** Kênh trong bộ nhớ giữa một client và host; giao bất đồng bộ (microtask) để không gọi lồng nhau. */
export function memoryTransport(host, connId) {
  let h = null, open = false;
  const deliver = (fn) => queueMicrotask(fn);
  const t = {
    attach(handlers) {
      h = handlers;
      host.connect(connId, (msg) => { const s = JSON.stringify(msg); deliver(() => open && h.onMessage(JSON.parse(s))); });
      open = true;
      deliver(() => h.onOpen());
    },
    send(msg) { const s = JSON.stringify(msg); deliver(() => open && host.message(connId, JSON.parse(s))); },
    close() { if (open) { open = false; host.disconnect(connId); } },
  };
  return t;
}

/**
 * opts: { dict, mode: 'bot'|'hotseat', botLevel, names:[a,b], config, storage?: {get(k),set(k,v),remove(k)} , storageKey }
 * Trả về MatchSession. Chế độ 2 người chung máy: hai client cùng trang, UI chuyển góc nhìn theo lượt.
 */
export function createLocalSession(opts) {
  const sch = opts.scheduler || realScheduler();
  const key = opts.storageKey || 'noi-tu:local';
  const names = opts.names || ['Bạn', 'Máy'];
  const seats = opts.mode === 'hotseat'
    ? [{ kind: 'human', id: 'p0', name: names[0], token: 't0' }, { kind: 'human', id: 'p1', name: names[1], token: 't1' }]
    : [{ kind: 'human', id: 'p0', name: names[0], token: 't0' }, { kind: 'bot', id: 'bot', name: names[1] }];

  let saved = null;
  try { saved = opts.storage && JSON.parse(opts.storage.get(key) || 'null'); } catch { saved = null; }
  const pin = pinOf(opts.dict);
  const canResume = saved && saved.mode === opts.mode && saved.log?.[0]?.pin?.dictHash === pin.dictHash
    && saved.log[0].pin.rulesVersion === pin.rulesVersion && saved.log[0].pin.normVersion === pin.normVersion;

  const host = new RefereeHost({
    matchId: canResume ? saved.log[0].matchId : `local-${Date.now().toString(36)}`,
    dict: opts.dict, scheduler: sch, seats, config: opts.config, botLevel: opts.botLevel || 'easy',
    seed: opts.seed ?? (Date.now() >>> 0), log: canResume ? saved.log : undefined,
  });
  if (canResume) host.resumeClock(); // đóng tab giữa ván: tính giờ lại lượt đang dở, không xử thua

  const persist = () => opts.storage?.set(key, JSON.stringify({ mode: opts.mode, log: host.log }));
  // luôn gửi pin: trọng tài từ chối mọi join thiếu/sai pin
  const mk = (i) => new MatchClient({ transport: memoryTransport(host, `local-${i}`), token: seats[i].token, pin, scheduler: sch, retryMs: 1500 });
  const clients = seats.map((s, i) => (s.kind === 'human' ? mk(i) : null)).filter(Boolean);
  clients[0].on('state', persist);
  const session = clients[0];
  // Rời game: đóng MỌI client (cả hai ghế hotseat) rồi dừng trọng tài ⇒ không còn hẹn giờ nào chạy ngầm
  // (không tự đổi ghế sang bot, không mở ván mới sau khi đã rời). Gọi dispose ở client nào cũng được.
  let disposed = false;
  const own = clients.map((c) => c.dispose.bind(c));
  const disposeAll = () => {
    if (disposed) return;
    disposed = true;
    own.forEach((d) => d());
    host.dispose();
  };
  for (const c of clients) c.dispose = disposeAll;
  session.host = host;               // chỉ để test/gỡ lỗi; UI không được dùng
  session.seatsClients = clients;    // hotseat: clients[0] ghế 0, clients[1] ghế 1
  session.clearSaved = () => opts.storage?.remove(key);
  return session;
}
