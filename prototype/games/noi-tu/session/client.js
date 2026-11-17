// MatchClient — hiện thực interface MatchSession mà UI dùng. Không biết trọng tài ở đâu:
// cùng trang (LocalSession), tiến trình khác (test), hay server Colyseus (OnlineSession sau này) — chỉ khác transport.
//
// transport: { send(msg), attach({ onOpen, onMessage, onClose }), close?() }
// Đảm bảo: (1) mỗi lệnh có commandId, gửi lại cùng commandId đến khi có kết quả ⇒ mất ACK không đánh 2 lần;
// (2) chỉ áp sự kiện kế tiếp (seq+1), bỏ sự kiện trùng, gặp khoảng trống thì xin snapshot (không chạy lại hiệu ứng);
// (3) đồng hồ: ước lượng lệch giờ với server từ nhiều mẫu ping, lấy mẫu RTT nhỏ nhất.
import { reduce } from '../core/rules.js';

export function estimateOffset(samples) {
  // sample: { t0: giờ client lúc gửi, t1: giờ client lúc nhận, serverTime }
  let best = null;
  for (const s of samples) {
    const rtt = s.t1 - s.t0;
    if (rtt < 0) continue;
    if (!best || rtt < best.rtt) best = { rtt, offset: s.serverTime - (s.t0 + s.t1) / 2 };
  }
  return best;
}

let idSeed = 0;
const defaultId = () => globalThis.crypto?.randomUUID?.() ?? `c${Date.now().toString(36)}${(++idSeed).toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export class MatchClient {
  constructor({ transport, token, matchId = null, pin = null, scheduler, retryMs = 1000, pingEveryMs = 3000, newId = defaultId }) {
    Object.assign(this, { transport, token, matchId, pin, sch: scheduler, retryMs, pingEveryMs, newId });
    this.state = null;
    this.seq = 0;
    this.mySeat = null;
    this.statusValue = 'connecting';
    this.buffer = new Map();
    this.pending = new Map();      // commandId → { msg, resolve, timer }
    this.syncTimer = null;
    this.samples = [];
    this.offset = 0;
    this.rtt = null;
    this.handlers = { state: new Set(), event: new Set(), status: new Set(), presence: new Set() };
    this.fxSeen = 0;               // seq lớn nhất đã chạy hiệu ứng — chặn chạy lại hiệu ứng cũ
    this.pingN = 0;
    transport.attach({ onOpen: () => this._open(), onMessage: (m) => this._msg(m), onClose: () => this._closed() });
  }

  // ----- interface MatchSession -----
  on(type, fn) { this.handlers[type].add(fn); return () => this.handlers[type].delete(fn); }
  get status() { return this.statusValue; }
  submit(word) { return this._command({ type: 'submit', word, expectedSeq: this.seq }); }
  resign() { return this._command({ type: 'resign' }); }
  rematch() { return this._command({ type: 'rematch' }); }
  serverNow() { return this.sch.now() + this.offset; }
  remainingMs() { const r = this.state?.round; return r && !r.over && r.deadlineAt ? Math.max(0, r.deadlineAt - this.serverNow()) : null; }
  dispose() {
    for (const p of this.pending.values()) { this.sch.cancel(p.timer); p.resolve({ ok: false, reason: 'disposed' }); }
    this.pending.clear();
    if (this.pingTimer) this.sch.cancel(this.pingTimer);
    if (this.syncTimer) this.sch.cancel(this.syncTimer);
    this._status('closed');
    this.transport.close?.();
  }

  // ----- nội bộ -----
  _fire(type, arg) { for (const fn of this.handlers[type]) fn(arg); }
  _status(s) { if (this.statusValue !== s) { this.statusValue = s; this._fire('status', s); } }

  _command(body) {
    if (!this.state) return Promise.resolve({ ok: false, reason: 'not-ready' });
    const commandId = this.newId();
    const msg = { t: 'intent', commandId, matchId: this.state.matchId, roundId: this.state.round?.id ?? null, ...body };
    return new Promise((resolve) => {
      const p = { msg, resolve, timer: null };
      this.pending.set(commandId, p);
      const send = () => {
        this.transport.send(msg);              // gửi lại NGUYÊN lệnh cũ (cùng commandId)
        p.timer = this.sch.at(this.sch.now() + this.retryMs, send);
      };
      send();
    });
  }

  _open() {
    this._status('connecting');
    this.transport.send({ t: 'join', token: this.token, matchId: this.matchId, pin: this.pin, lastSeq: this.seq });
  }

  _closed() { if (this.statusValue !== 'closed') this._status('reconnecting'); }

  _msg(m) {
    switch (m.t) {
      case 'welcome':
        this.mySeat = m.seat;
        this._status('live');
        this._ping();
        for (const p of this.pending.values()) this.transport.send(p.msg); // kết nối lại: gửi lại lệnh còn treo
        break;
      case 'joinRejected': this.rejectReason = m.reason; this._status('closed'); break;
      case 'kicked': this._status('closed'); break;
      case 'snapshot': return this._snapshot(m);
      case 'event': return this._event(m.ev);
      case 'result': {
        const p = this.pending.get(m.commandId);
        if (!p) return;                        // kết quả trùng (do gửi lại) ⇒ bỏ qua
        this.pending.delete(m.commandId);
        this.sch.cancel(p.timer);
        p.resolve(m.res);
        break;
      }
      case 'pong': {
        if (m.id !== this.pingN) return;
        this.samples.push({ t0: m.t0, t1: this.sch.now(), serverTime: m.serverTime });
        if (this.samples.length > 8) this.samples.shift();
        const est = estimateOffset(this.samples);
        if (est) { this.offset = est.offset; this.rtt = est.rtt; }
        break;
      }
      case 'presence':
        if (m.seat !== this.mySeat) this._status(m.online ? 'live' : 'opponent-left');
        this._fire('presence', m);
        break;
    }
  }

  _ping() {
    if (this.pingTimer) this.sch.cancel(this.pingTimer);
    this.transport.send({ t: 'ping', id: ++this.pingN, t0: this.sch.now() });
    this.pingTimer = this.sch.at(this.sch.now() + this.pingEveryMs, () => this._ping());
  }

  _snapshot(m) {
    if (this.state && m.snapshotSeq < this.seq) return; // snapshot cũ hơn những gì đã có
    this.state = m.state;
    this.seq = m.snapshotSeq;
    this.fxSeen = Math.max(this.fxSeen, this.seq);   // mọi thứ trong snapshot coi như đã "xảy ra", không chạy hiệu ứng
    for (const k of this.buffer.keys()) if (k <= this.seq) this.buffer.delete(k);
    this._drain();
    this._fire('state', this.state);
  }

  _event(ev) {
    if (!this.state || ev.seq <= this.seq) { if (this.state) return; this.buffer.set(ev.seq, ev); return; } // trùng ⇒ bỏ
    if (ev.seq === this.seq + 1) {
      this._apply(ev);
      this._drain();
      this._fire('state', this.state);
    } else {
      this.buffer.set(ev.seq, ev);
      this._requestSync();
    }
  }

  _apply(ev) {
    this.state = reduce(this.state, ev);
    this.seq = ev.seq;
    if (ev.seq > this.fxSeen) { this.fxSeen = ev.seq; this._fire('event', ev); }
  }

  _drain() {
    while (this.buffer.has(this.seq + 1)) { const ev = this.buffer.get(this.seq + 1); this.buffer.delete(ev.seq); this._apply(ev); }
    for (const k of this.buffer.keys()) if (k <= this.seq) this.buffer.delete(k);
    if (!this.buffer.size && this.syncTimer) { this.sch.cancel(this.syncTimer); this.syncTimer = null; }
  }

  _requestSync() {
    if (this.syncTimer) return;
    const ask = () => {
      this.transport.send({ t: 'sync', fromSeq: this.seq });
      this.syncTimer = this.sch.at(this.sch.now() + this.retryMs, () => { this.syncTimer = null; if (this.buffer.size) this._requestSync(); });
    };
    ask();
  }
}
