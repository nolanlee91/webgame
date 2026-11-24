// Phòng Ô Ăn Quan online 1v1 / 2v2 — máy chủ là nguồn sự thật duy nhất.
// Luật lấy NGUYÊN từ prototype/games/o-an-quan/logic.js (truyền vào qua `L`), máy đánh thay lấy từ ai.js (`A`) — không chép lại luật.
// Client chỉ gửi Ý ĐỊNH ("rải ô 3 sang phải"); máy chủ kiểm tra đúng người / đúng lượt / nước hợp lệ rồi mới áp dụng.
// Ghế theo thứ tự vào phòng; đội = ghế % 2 (ghế 0, 2 = đội A, hàng dưới; ghế 1, 3 = đội B, hàng trên).
// Thứ tự lượt 2v2: A1 → B1 → A2 → B2 (ghế 0 → 1 → 2 → 3). Ván sau đội thua đi trước (người kế tiếp của đội đó).
"use strict";
const { Chat } = require("../co-caro/chat");
const { cleanName } = require("../co-caro/room");

const DEFAULT_TIMINGS = {
  turn: 60000,   // người đang có lượt không đi → máy chủ đi thay (máy khó) để ván không treo
  away: 15000,   // người có lượt đang mất kết nối → đi thay sớm hơn
};

class Room {
  constructor({ code, L, A, clock, onChange, timings, size, rule }) {
    this.code = code; this.L = L; this.A = A; this.clock = clock;
    this.onChange = onChange || (() => {});
    this.t = { ...DEFAULT_TIMINGS, ...(timings || {}) };
    this.max = size === 4 ? 4 : 2;
    this.rule = rule === "quan-non" ? "quan-non" : "thuong";
    this.players = [];     // { token, ip, name, connected }
    this.phase = "lobby";  // lobby → play → over → (again) play …; có người rời giữa trận → về lobby chờ người mới
    this.s = null;         // trạng thái logic.js của ván đang chơi
    this.gid = 0;          // số thứ tự ván (đổi khi bắt đầu / ván tiếp / về phòng chờ)
    this.seq = 0;          // số nước đã đi trong ván — client dùng để phát hiện thiếu gói
    this.startSeat = 0;    // ghế đi nước đầu của ván
    this.seat = 0;         // ghế đang có lượt
    this.lastAct = null;   // nước vừa đi { pit, dir, seat, auto }
    this.deadline = 0; this.actAt = null; this.timer = null;
    this.closed = false;
    this.chat = new Chat(clock);
  }

  get hostSeat() { return this.players.length ? 0 : -1; }

  join(name, token, ip = "") {
    if (this.closed) return { err: "no-room" };
    if (this.phase !== "lobby") return { err: "started" };
    if (this.players.length >= this.max) return { err: "full" };
    this.players.push({ token, ip, name: cleanName(name, "Người " + (this.players.length + 1)), connected: true });
    this.changed();
    return { ok: true };
  }

  /** Rời phòng. Thiếu người thì không chơi tiếp được → về phòng chờ, chờ người mới (người vào sau ngồi ghế trống cuối). */
  leave(i) {
    if (!this.players[i]) return;
    this.chat.forget(this.players[i].token);
    this.players.splice(i, 1);
    if (!this.players.length) return this.close();
    if (this.phase !== "lobby") { this.phase = "lobby"; this.s = null; this.gid++; this.seq = 0; this.lastAct = null; this.oppLeft = true; }
    this.schedule();
    this.changed();
  }

  setConnected(i, on) {
    const p = this.players[i]; if (!p || p.connected === on) return;
    p.connected = on;
    if (this.phase === "play" && this.seat === i) this.schedule(false);
    this.changed();
  }

  newGame(first) {
    this.s = this.L.newMatch({ rule: this.rule, mode: "pvp", first: this.startSeat % 2 });
    if (first) this.s = { ...this.s, tally: first.tally.slice(), round: first.round + 1 };
    this.seat = this.startSeat;
    this.phase = "play"; this.gid++; this.seq = 0; this.lastAct = null;
    this.schedule(); this.changed();
  }

  handle(i, m) {
    if (this.closed) return { err: "no-room" };
    if (!this.players[i]) return { err: "no-seat" };
    switch (m.t) {
      case "start":
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        if (this.players.length < this.max) return { err: "need-all" };
        this.startSeat = 0; this.oppLeft = false;
        this.newGame(null);
        return { ok: true };
      case "rule": // chủ phòng đổi luật quan non ở phòng chờ
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        if (m.rule !== "quan-non" && m.rule !== "thuong") return { err: "bad" };
        this.rule = m.rule; this.changed(); return { ok: true };
      case "again": {
        if (this.phase !== "over") return { err: "phase" };
        if (this.players.length < this.max) return { err: "need-all" };
        // đội thua đi trước (hòa: đổi đội); trong đội lần lượt từng người
        const prev = this.s, loser = prev.winner === 0 ? 1 : prev.winner === 1 ? 0 : 1 - (this.startSeat % 2);
        let k = (this.startSeat + 1) % this.max;
        while (k % 2 !== loser) k = (k + 1) % this.max;
        this.startSeat = k;
        this.newGame(prev);
        return { ok: true };
      }
      case "move": {
        if (this.phase !== "play") return { err: "phase" };
        if (this.seat !== i) return { err: "not-turn" };
        if (!Number.isInteger(m.pit) || (m.dir !== 1 && m.dir !== -1)) return { err: "bad" };
        return this.doMove(m.pit, m.dir, false) ? { ok: true } : { err: "illegal" };
      }
      case "chat": {
        const me = this.players[i];
        const r = this.chat.post(me, m.text, this.players.filter((x) => x.ip === me.ip).length);
        if (r.ok) this.changed();
        return r;
      }
      default: return { err: "bad" };
    }
  }

  doMove(pit, dir, auto) {
    const n = this.L.play(this.s, pit, dir);
    if (!n) return false;
    this.lastAct = { pit, dir, seat: this.seat, auto: !!auto };
    this.s = n; this.seq++;
    if (this.L.isOver(n)) this.phase = "over";
    else this.seat = (this.seat + 1) % this.max;
    this.schedule(); this.changed();
    return true;
  }

  /** Hẹn giờ máy chủ đi thay. fresh=true khi bắt đầu một lượt mới; false khi chỉ đổi kết nối — khi đó hạn chỉ có thể ngắn lại. */
  schedule(fresh = true) {
    this.clock.clearTimeout(this.timer); this.timer = null; this.deadline = 0;
    if (this.phase !== "play" || this.closed) return;
    const now = this.clock.now(), who = this.players[this.seat];
    if (fresh || this.actAt == null) this.actAt = now;
    let end = this.actAt + this.t.turn;
    if (who && !who.connected) end = Math.min(end, now + this.t.away);
    this.deadline = end;
    this.timer = this.clock.setTimeout(() => this.timeout(), Math.max(0, end - now));
    this.timer?.unref?.();
  }

  timeout() {
    this.timer = null;
    if (this.phase !== "play" || this.closed) return;
    const mv = this.A.bestMove(this.s, "hard", { timeMs: 120 });
    if (!mv || !this.doMove(mv[0], mv[1], true)) {
      const [first] = this.L.legalMoves(this.s);
      if (first) this.doMove(first[0], first[1], true);
    }
  }

  changed() { if (!this.closed) this.onChange(); }

  close() { this.closed = true; this.clock.clearTimeout(this.timer); this.timer = null; }

  /** Góc nhìn gửi cho người thứ i. Không có thông tin ẩn — chỉ bỏ token. Nước đi đủ để client dựng lại ván + hoạt cảnh. */
  viewFor(i) {
    const s = this.s;
    return {
      code: this.code, phase: this.phase, you: i, host: this.hostSeat, max: this.max, rule: this.rule,
      gid: this.gid, seq: this.seq, act: this.lastAct, seat: this.seat, startSeat: this.startSeat, deadline: this.deadline, oppLeft: !!this.oppLeft,
      players: this.players.map((p) => ({ name: p.name, connected: p.connected })),
      chat: this.chat.view(this.players[i]?.token),
      game: s && { first: s.first, round: s.round, tally: s.tally, turn: s.turn, moves: s.moves, pits: s.pits, quan: s.quan, score: s.score, debt: s.debt, eaten: s.eaten, quanBy: s.quanBy, winner: s.winner, final: s.final, quanNon: s.quanNon },
    };
  }
}

module.exports = { Room, DEFAULT_TIMINGS };
