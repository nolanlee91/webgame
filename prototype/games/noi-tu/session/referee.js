// Trọng tài (nguồn sự thật duy nhất của ván). Chạy trong trình duyệt cho bản offline (LocalSession) và
// sau này chạy nguyên văn trong room Colyseus trên server. Không biết gì về mạng: nhận "kết nối" trừu tượng
// connect/message/disconnect, gửi lại thông điệp JSON được.
import { reduce, validate, pinOf, samePin, nextFirst, replay } from '../core/rules.js';
import { pickWord } from '../core/ai.js';
import { createRng } from '../core/rng.js';

// Cache idempotent: giữ kết quả của 500 lệnh gần nhất (toàn trận, cả hai ghế). Gửi lại một commandId đã bị đẩy ra
// khỏi cache sẽ được xử lý như lệnh mới — an toàn vì submit còn phải khớp expectedSeq (lệnh cũ sẽ nhận 'stale').
const RESULT_CACHE = 500;

export class RefereeHost {
  /**
   * opts: { matchId, dict, scheduler, seats:[{kind:'human'|'bot', id, name, token?}], config?, seed?,
   *         graceMs?: thời gian chờ kết nối lại trước khi bot thay ghế (mặc định 30 s),
   *         botDelay?: [min,max] ms, botLevel?: 'easy'|'hard', first?: ghế đi trước ván 1, log?: khôi phục từ log }
   */
  constructor(opts) {
    this.o = { graceMs: 30000, botDelay: [800, 2500], botLevel: 'easy', first: 0, seed: 1, ...opts };
    this.dict = opts.dict;
    this.sch = opts.scheduler;
    this.rng = createRng(this.o.seed);
    this.conns = new Map();            // connId → { send, seat }
    this.seatConn = [null, null];
    this.tokens = new Map();           // token → seat
    this.humans = [null, null];        // danh tính người thật của ghế (để lấy lại ghế sau khi bot thay)
    this.reclaim = [false, false];
    this.results = new Map();          // `${seat}:${commandId}` → kết quả (idempotent)
    this.timers = { deadline: null, bot: null, grace: [null, null] };
    this.log = [];
    this.state = null;
    opts.seats.forEach((s, i) => { if (s.kind === 'human') { this.humans[i] = s; if (s.token) this.tokens.set(s.token, i); } });
    if (opts.log?.length) {
      this.log = opts.log.slice();
      this.state = replay(this.log);
      this._afterEvent(null);
    } else {
      this._emit({ type: 'matchCreated', matchId: this.o.matchId, pin: pinOf(this.dict), config: this.o.config || {},
        seats: opts.seats.map(({ kind, id, name }) => ({ kind, id, name })) });
      this._startRound(this.o.first);
    }
  }

  get now() { return this.sch.now(); }

  /** Dừng hẳn trọng tài: hủy mọi hẹn giờ (hết lượt, bot, chờ kết nối lại), bỏ qua mọi thông điệp sau đó. */
  dispose() {
    this.closed = true;
    const t = this.timers;
    for (const id of [t.deadline, t.bot, ...t.grace]) if (id != null) this.sch.cancel(id);
    this.timers = { deadline: null, bot: null, grace: [null, null] };
    this.conns.clear();
    this.seatConn = [null, null];
  }

  // ---------- kết nối ----------
  connect(connId, send) { if (!this.closed) this.conns.set(connId, { send, seat: null }); }

  disconnect(connId) {
    if (this.closed) return;
    const c = this.conns.get(connId);
    this.conns.delete(connId);
    if (!c || c.seat == null || this.seatConn[c.seat] !== connId) return;
    const seat = c.seat;
    this.seatConn[seat] = null;
    this._broadcast({ t: 'presence', seat, online: false, graceUntil: this.now + this.o.graceMs });
    if (this.state.seats[seat].kind === 'human') {
      // Không thay bot ngay khi rớt mạng thoáng qua: chờ graceMs. Đồng hồ lượt vẫn chạy trong lúc đó.
      this.timers.grace[seat] = this.sch.at(this.now + this.o.graceMs, () => this._graceExpired(seat));
    }
  }

  /** Ghế người chưa từng join (rớt trước khi ván bắt đầu, hoặc kết nối mà không gửi 'join'):
   *  cũng chờ graceMs rồi cho bot thay — join kịp thì hẹn giờ tự hủy. */
  awaitJoin(seat) {
    if (this.closed || this.seatConn[seat] != null || this.timers.grace[seat] != null) return;
    if (this.state.seats[seat].kind !== 'human') return;
    this.timers.grace[seat] = this.sch.at(this.now + this.o.graceMs, () => this._graceExpired(seat));
  }

  message(connId, msg) {
    const c = this.conns.get(connId);
    if (!c || this.closed) return;
    if (!msg || typeof msg !== 'object') return;   // thông điệp hỏng (null, chuỗi...) ⇒ bỏ qua, không làm sập trọng tài
    this._checkDeadline();
    switch (msg.t) {
      case 'join': return this._join(connId, c, msg);
      case 'ping': return c.send({ t: 'pong', id: msg.id, t0: msg.t0, serverTime: this.now });
      case 'sync':                                    // chỉ người đã vào phòng mới được xem ván
        if (c.seat == null) return c.send({ t: 'syncRejected', reason: 'not-joined' });
        return c.send(this._snapshot());
      case 'intent': {
        if (c.seat == null) return c.send({ t: 'result', commandId: msg.commandId, res: { ok: false, reason: 'not-joined' } });
        const res = this._intent(c.seat, msg);
        return c.send({ t: 'result', commandId: msg.commandId, res });
      }
    }
  }

  _join(connId, c, m) {
    const seat = this.tokens.get(m.token);
    if (m.matchId && m.matchId !== this.state.matchId) return c.send({ t: 'joinRejected', reason: 'wrong-match' });
    if (seat == null) return c.send({ t: 'joinRejected', reason: 'bad-token' });
    // Bắt buộc ghim phiên bản: thiếu pin cũng bị từ chối (không lặng lẽ chơi bằng từ điển/luật khác)
    if (!m.pin) return c.send({ t: 'joinRejected', reason: 'pin-required', pin: this.state.pin });
    if (!samePin(m.pin, this.state.pin)) return c.send({ t: 'joinRejected', reason: 'pin-mismatch', pin: this.state.pin });
    const old = this.seatConn[seat];
    if (old != null && old !== connId) { this.conns.get(old)?.send({ t: 'kicked', reason: 'joined-elsewhere' }); this.conns.delete(old); }
    c.seat = seat;
    this.seatConn[seat] = connId;
    if (this.timers.grace[seat]) { this.sch.cancel(this.timers.grace[seat]); this.timers.grace[seat] = null; }
    c.send({ t: 'welcome', seat, pin: this.state.pin, serverTime: this.now });
    c.send(this._snapshot());
    this._broadcast({ t: 'presence', seat, online: true });
    if (this.state.seats[seat].kind === 'bot') {
      // bot đã thay ghế: người cũ lấy lại ghế ở đầu ván sau, không giật ghế giữa ván
      this.reclaim[seat] = true;
      if (!this.state.round || this.state.round.over) this._reclaimNow();
    }
  }

  _snapshot() { return { t: 'snapshot', snapshotSeq: this.state.seq, state: this.state }; }

  // ---------- lệnh (intent) ----------
  _intent(seat, m) {
    if (!m.commandId) return { ok: false, reason: 'bad-command' };
    const key = `${seat}:${m.commandId}`;
    if (this.results.has(key)) return this.results.get(key); // gửi lại cùng commandId ⇒ trả kết quả cũ, không đánh 2 lần
    const res = this._apply(seat, m);
    this.results.set(key, res);
    if (this.results.size > RESULT_CACHE) this.results.delete(this.results.keys().next().value);
    return res;
  }

  _apply(seat, m) {
    const s = this.state, r = s.round, seq = () => this.state.seq;
    if (m.matchId !== s.matchId) return { ok: false, reason: 'wrong-match', seq: seq() };
    if (s.seats[seat].kind !== 'human') return { ok: false, reason: 'seat-taken-by-bot', seq: seq() };
    if (!r || m.roundId !== r.id) return { ok: false, reason: 'stale-round', seq: seq() };
    switch (m.type) {
      case 'submit': {
        // chỉ submit phải khớp đúng expectedSeq: từ được chọn dựa trên chuỗi người chơi đang thấy
        if (m.expectedSeq !== s.seq) return { ok: false, reason: 'stale', seq: seq() };
        if (r.over) return { ok: false, reason: 'not-playing', seq: seq() };
        if (this.now >= r.deadlineAt) return { ok: false, reason: 'late', seq: seq() }; // giờ của server, không tin giờ client
        const v = validate(s, seat, m.word, this.dict);
        if (!v.ok) return { ok: false, reason: v.reason, key: v.key, need: v.need, seq: seq() };
        this._play(seat, v);
        return { ok: true, word: v.key, seq: seq() };
      }
      case 'resign':
        if (r.over) return { ok: true, already: true, seq: seq() };
        this._emit({ type: 'roundEnded', roundId: r.id, winner: 1 - seat, reason: 'resign', at: this.now });
        return { ok: true, seq: seq() };
      case 'rematch':
        if (!r.over) return { ok: false, reason: 'round-in-progress', seq: seq() };
        if (!s.rematch[seat]) this._emit({ type: 'rematchRequested', seat });
        this._maybeStart();
        return { ok: true, seq: seq() };
      default:
        return { ok: false, reason: 'bad-command', seq: seq() };
    }
  }

  _play(seat, v) {
    const r = this.state.round, at = this.now;
    this._emit({ type: 'played', roundId: r.id, seat, word: v.key, at, deadlineAt: at + this.state.config.turnMs });
    // Không còn đường nối (đã trừ từ vừa dùng) ⇒ kết thúc ngay, người vừa đánh thắng, không bắt đối thủ chờ hết giờ.
    if (v.deadEnd) this._emit({ type: 'roundEnded', roundId: r.id, winner: seat, reason: 'no-move', at });
  }

  _startRound(first) {
    const no = this.state.roundNo + 1, at = this.now;
    this._emit({ type: 'roundStarted', roundId: `${this.state.matchId}-r${no}`, first, at, deadlineAt: at + this.state.config.turnMs });
  }

  _maybeStart() {
    const s = this.state;
    if (s.round && !s.round.over) return;
    if (s.rematch[0] && s.rematch[1]) this._startRound(nextFirst(s));
  }

  /** Chỉ offline: mở lại tab giữa ván ⇒ tính giờ lại lượt hiện tại thay vì xử thua vì thời gian đóng tab. */
  resumeClock() {
    const r = this.state.round;
    if (r && !r.over) this._emit({ type: 'clockReset', roundId: r.id, deadlineAt: this.now + this.state.config.turnMs });
  }

  _graceExpired(seat) {
    this.timers.grace[seat] = null;
    if (this.closed) return;
    if (this.seatConn[seat] != null || this.state.seats[seat].kind !== 'human') return;
    const h = this.humans[seat];
    this._emit({ type: 'seatChanged', seat, kind: 'bot', id: `bot-${seat}`, name: `Máy (thay ${h?.name ?? 'người chơi'})` });
  }

  _reclaimNow() {
    for (const seat of [0, 1]) {
      if (!this.reclaim[seat] || this.seatConn[seat] == null) continue;
      this.reclaim[seat] = false;
      const h = this.humans[seat];
      if (this.state.seats[seat].kind === 'bot') this._emit({ type: 'seatChanged', seat, kind: 'human', id: h.id, name: h.name });
    }
  }

  // ---------- đồng hồ + bot ----------
  _checkDeadline() {
    const r = this.state.round;
    if (r && !r.over && this.now >= r.deadlineAt) {
      this._emit({ type: 'roundEnded', roundId: r.id, winner: 1 - r.turn, reason: 'timeout', at: r.deadlineAt });
    }
  }

  _afterEvent(ev) {
    const s = this.state, r = s.round;
    if (this.timers.deadline) { this.sch.cancel(this.timers.deadline); this.timers.deadline = null; }
    if (this.timers.bot) { this.sch.cancel(this.timers.bot); this.timers.bot = null; }
    if (!r) return;
    if (!r.over) {
      this.timers.deadline = this.sch.at(r.deadlineAt, () => { this.timers.deadline = null; if (!this.closed) this._checkDeadline(); });
      if (s.seats[r.turn].kind === 'bot') {
        const [a, b] = this.o.botDelay, seqAt = s.seq, seat = r.turn;
        this.timers.bot = this.sch.at(this.now + a + this.rng.int(Math.max(1, b - a)), () => {
          this.timers.bot = null;
          if (this.closed) return;
          // Kiểm lại NGAY LÚC áp nước, không chỉ lúc lên lịch: event loop có thể nghẽn khiến callback chạy trễ
          // quá deadline. Quá giờ ⇒ xử thua vì hết giờ như người thật, bot không được đánh.
          this._checkDeadline();
          const cur = this.state.round;
          if (this.state.seq !== seqAt || !cur || cur.over || cur.id !== r.id || cur.turn !== seat) return;
          if (this.state.seats[seat].kind !== 'bot') return;
          const word = pickWord(this.state, this.dict, this.o.botLevel, this.rng);
          const v = word ? validate(this.state, seat, word, this.dict) : null;
          if (!v?.ok) return this._emit({ type: 'roundEnded', roundId: r.id, winner: 1 - seat, reason: 'resign', at: this.now });
          this._play(seat, v);
        });
      }
      return;
    }
    if (ev?.type === 'roundEnded') this._reclaimNow();
    // bot luôn sẵn sàng chơi lại
    for (const seat of [0, 1]) if (this.state.seats[seat].kind === 'bot' && !this.state.rematch[seat] && this.state.round.over) {
      this._emit({ type: 'rematchRequested', seat });
    }
    if (ev && ev.type !== 'roundStarted') this._maybeStart();
  }

  _emit(partial) {
    const ev = { ...partial, seq: (this.state?.seq ?? 0) + 1 };
    this.state = reduce(this.state, ev);
    this.log.push(ev);
    this._broadcast({ t: 'event', ev });
    this._afterEvent(ev);
  }

  _broadcast(msg) { for (const c of this.conns.values()) if (c.seat != null) c.send(msg); }
}
