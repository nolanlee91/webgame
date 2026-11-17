// "Server" độc lập cho test hợp đồng: chạy trong TIẾN TRÌNH NODE RIÊNG, tự dựng từ điển và trọng tài của nó,
// chỉ nói chuyện với client qua IPC bằng chuỗi JSON. Đồng hồ giả, chỉ chạy khi test gửi lệnh advance.
import { RefereeHost } from '../session/referee.js';
import { fakeScheduler } from '../session/scheduler.js';
import { createDict } from '../core/dict.js';

let host = null, sch = null;
const out = (connId, msg) => process.send({ op: 'out', connId, data: JSON.stringify(msg) });

process.on('message', (m) => {
  switch (m.op) {
    case 'reset':
      sch = fakeScheduler(m.opts.serverT0);
      host = new RefereeHost({ ...m.opts.host, dict: createDict({ words: m.opts.words }), scheduler: sch });
      break;
    case 'connect': host.connect(m.connId, (msg) => out(m.connId, msg)); break;
    case 'msg': host.message(m.connId, JSON.parse(m.data)); break;
    case 'disconnect': host.disconnect(m.connId); break;
    case 'advance': sch.advance(m.ms); break;
    case 'dump': process.send({ op: 'dump', id: m.id, log: host.log, state: host.state }); return;
    case 'exit': process.exit(0);
  }
  if (m.id != null) process.send({ op: 'ack', id: m.id });
});
process.send({ op: 'ready' });
