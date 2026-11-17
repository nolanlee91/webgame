// Hạ tầng test hợp đồng: hai backend cho cùng một bộ test
//  - 'process': trọng tài ở TIẾN TRÌNH NODE RIÊNG (test/referee-proc.mjs), chỉ trao đổi chuỗi JSON qua IPC
//  - 'inproc' : trọng tài cùng tiến trình, giao bất đồng bộ + JSON (giống LocalSession)
// Giữa client và trọng tài có "đường truyền lỗi" lập trình được: rơi gói, nhân đôi, giữ lại rồi thả muộn.
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { RefereeHost } from '../session/referee.js';
import { fakeScheduler } from '../session/scheduler.js';
import { MatchClient } from '../session/client.js';
import { createDict } from '../core/dict.js';
import { TEST_WORDS, SERVER_T0, CLIENT_T0 } from './fixtures.mjs';

const tick = () => new Promise((r) => setImmediate(r));

function inprocBackend() {
  let host, sch;
  const sinks = new Map();
  return {
    name: 'inproc',
    async reset(hostOpts) { sch = fakeScheduler(SERVER_T0); host = new RefereeHost({ ...hostOpts, dict: createDict({ words: TEST_WORDS }), scheduler: sch }); },
    connect(connId, onMessage) {
      sinks.set(connId, onMessage);
      host.connect(connId, (msg) => { const s = JSON.stringify(msg); setImmediate(() => sinks.get(connId)?.(JSON.parse(s))); });
      return { send: (msg) => { const s = JSON.stringify(msg); setImmediate(() => host.message(connId, JSON.parse(s))); } };
    },
    disconnect(connId) { sinks.delete(connId); host.disconnect(connId); },
    async advanceServer(ms) { sch.advance(ms); },
    async flush() { for (let i = 0; i < 12; i++) await tick(); },
    async dump() { return JSON.parse(JSON.stringify({ log: host.log, state: host.state })); },
    async close() {},
  };
}

function processBackend() {
  const child = fork(fileURLToPath(new URL('./referee-proc.mjs', import.meta.url)), [], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
  const sinks = new Map(), waits = new Map();
  let id = 0;
  const ready = new Promise((r) => child.once('message', r));
  child.on('message', (m) => {
    if (m.op === 'out') { const f = sinks.get(m.connId); if (f) setImmediate(() => f(JSON.parse(m.data))); }
    else if (m.op === 'ack' || m.op === 'dump') { waits.get(m.id)?.(m); waits.delete(m.id); }
  });
  const call = (msg) => new Promise((r) => { const i = ++id; waits.set(i, r); child.send({ ...msg, id: i }); });
  return {
    name: 'process',
    async reset(hostOpts) { await ready; await call({ op: 'reset', opts: { serverT0: SERVER_T0, words: TEST_WORDS, host: hostOpts } }); },
    connect(connId, onMessage) {
      sinks.set(connId, onMessage);
      child.send({ op: 'connect', connId });
      return { send: (msg) => child.send({ op: 'msg', connId, data: JSON.stringify(msg) }) };
    },
    disconnect(connId) { sinks.delete(connId); child.send({ op: 'disconnect', connId }); },
    advanceServer: (ms) => call({ op: 'advance', ms }),
    async flush() { for (let i = 0; i < 4; i++) { await call({ op: 'noop' }); for (let k = 0; k < 4; k++) await tick(); } },
    async dump() { const m = await call({ op: 'dump' }); return { log: m.log, state: m.state }; },
    async close() { child.send({ op: 'exit' }); await new Promise((r) => child.once('exit', r)); },
  };
}

export const BACKENDS = { inproc: inprocBackend, process: processBackend };

/** Đường truyền có lỗi cho MỘT client. Quy tắc: { dir:'up'|'down', match(msg), action:'drop'|'dup'|'hold', times } */
function faultyTransport(backend, baseId) {
  let handlers = null, raw = null, connId = null, n = 0;
  const rules = [], held = [];
  const pass = (dir, msg, deliver) => {
    const rule = rules.find((r) => r.dir === dir && r.times > 0 && r.match(msg));
    if (!rule) return deliver(msg);
    rule.times--;
    if (rule.action === 'drop') return;
    if (rule.action === 'dup') { deliver(msg); deliver(JSON.parse(JSON.stringify(msg))); return; }
    if (rule.action === 'hold') held.push({ dir, msg, deliver });
  };
  const t = {
    attach(h) { handlers = h; t.reconnect(); },
    reconnect() {
      connId = `${baseId}#${++n}`;
      const myId = connId;
      raw = backend.connect(connId, (msg) => { if (connId === myId) pass('down', msg, (m) => handlers.onMessage(m)); });
      handlers.onOpen();
    },
    send(msg) { t.sent.push(msg.t); if (raw) pass('up', msg, (m) => raw.send(m)); },
    sent: [],
    cut() { if (!raw) return; backend.disconnect(connId); raw = null; connId = null; handlers.onClose(); },
    close() { t.cut(); },
    fault(rule) { rules.push({ times: 1, ...rule }); },
    releaseHeld() { const xs = held.splice(0); for (const x of xs) x.deliver(x.msg); return xs.length; },
  };
  return t;
}

export async function setup(backendName, hostOpts) {
  const backend = BACKENDS[backendName]();
  await backend.reset(hostOpts);
  const csch = fakeScheduler(CLIENT_T0);
  let ids = 0;
  const clients = [];
  const h = {
    backend, csch,
    client(token, extra = {}) {
      const tr = faultyTransport(backend, `c${++ids}`);
      const c = new MatchClient({ transport: tr, token, scheduler: csch, retryMs: 1000, pingEveryMs: 3000,
        newId: () => `${token}-cmd${++ids}`, ...extra });
      c.tr = tr;
      c.fx = []; c.on('event', (ev) => c.fx.push(ev.seq));
      clients.push(c);
      return c;
    },
    /** chạy thời gian: server trước, rồi client (hẹn giờ gửi lại/ping), rồi chờ mọi thông điệp tới nơi */
    async advance(ms) { await backend.advanceServer(ms); await backend.flush(); csch.advance(ms); await backend.flush(); },
    flush: () => backend.flush(),
    dump: () => backend.dump(),
    async close() { for (const c of clients) c.dispose(); await backend.close(); },
  };
  await h.flush();
  return h;
}
