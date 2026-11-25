// Phòng Cờ Caro online 1v1 — máy chủ là nguồn sự thật duy nhất.
// Luật lấy NGUYÊN từ prototype/games/co-caro/logic.js (truyền vào qua `L`), máy đi thay lấy từ ai.js (`A`) — không chép lại luật.
// Client chỉ gửi Ý ĐỊNH ("đặt quân ở ô r,c"); máy chủ kiểm tra đúng người / đúng lượt / ô hợp lệ rồi mới áp dụng.
// Người thứ 1 vào phòng (chủ phòng) cầm X, người thứ 2 cầm O — cố định suốt trận; ván sau người thua đi trước (luật gốc).
"use strict";
const { Chat } = require("./chat");

const MAX_PLAYERS = 2;
const DEFAULT_TIMINGS = {
  turn: 60000,    // người đang có lượt không đánh → máy chủ đánh thay (máy khó) để ván không treo
  away: 15000,    // người có lượt đang mất kết nối → đánh thay sớm hơn
};

// Tên: bộ lọc dùng chung games-server/moderation.js — bỏ ký tự điều khiển / vô hình / bidi và < >, cắt 16 ký tự thật
// (không cắt đôi emoji), dính từ tục hoặc link ⇒ dùng tên thay thế `fallback` (không bao giờ lưu / phát tên gốc).
const { cleanPlayerName } = require("../moderation");
function cleanName(raw, fallback) { return cleanPlayerName(raw, fallback); }

class Room {
  constructor({ code, L, A, clock, onChange, timings, size, rule }) {
    this.code = code; this.L = L; this.A = A; this.clock = clock;
    this.onChange = onChange || (() => {});
    this.t = { ...DEFAULT_TIMINGS, ...(timings || {}) };
    this.size = L.SIZES.includes(size) ? size : 15;
    this.rule = L.RULES.includes(rule) ? rule : "free";
    this.players = [];     // theo thứ tự vào phòng: { token, name, connected } — người i cầm quân i+1 (1 = X, 2 = O)
    this.phase = "lobby";  // lobby → play → over → (again) play …; có người rời giữa trận → về lobby chờ người mới
    this.s = null;         // trạng thái logic.js của trận đang chơi
    this.gid = 0;          // số thứ tự trận/ván (đổi khi bắt đầu / ván tiếp / về phòng chờ)
    this.seq = 0;          // số nước đã đi trong ván — client dùng để phát hiện thiếu gói
    this.lastAct = null;   // nước vừa đi { r, c, p, auto } (client dùng để vẽ hoạt ảnh)
    this.deadline = 0;
    this.actAt = null;
    this.timer = null;
    this.closed = false;
    this.chat = new Chat(clock); // trò chuyện của phòng — sống cùng phòng
  }

  get hostSeat() { return this.players.length ? 0 : -1; }

  join(name, token, ip = "") {
    if (this.closed) return { err: "no-room" };
    if (this.phase !== "lobby") return { err: "started" };
    if (this.players.length >= MAX_PLAYERS) return { err: "full" };
    this.players.push({ token, ip, name: cleanName(name, "Người " + (this.players.length + 1)), connected: true });
    this.changed();
    return { ok: true };
  }

  /** Rời phòng. Trận 1v1 không chơi tiếp được với 1 người → về phòng chờ, người còn lại làm chủ phòng (cầm X), chờ người mới. */
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
    // chỉ người đang có lượt mới làm đổi hạn chờ, và hạn không bao giờ dài quá hạn gốc của nước đi (chống kéo dài lượt)
    if (this.phase === "play" && this.s.turn === i + 1) this.schedule(false);
    this.changed();
  }

  handle(i, m) {
    if (this.closed) return { err: "no-room" };
    if (!this.players[i]) return { err: "no-seat" };
    switch (m.t) {
      case "start":
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        if (this.players.length < 2) return { err: "need-2" };
        this.s = this.L.newMatch({ size: this.size, rule: this.rule, mode: "pvp" });
        this.phase = "play"; this.gid++; this.seq = 0; this.lastAct = null; this.oppLeft = false;
        this.schedule(); this.changed(); return { ok: true };
      case "again":
        if (this.phase !== "over") return { err: "phase" };
        if (this.players.length < 2) return { err: "need-2" };
        this.s = this.L.nextRound(this.s);
        this.phase = "play"; this.gid++; this.seq = 0; this.lastAct = null;
        this.schedule(); this.changed(); return { ok: true };
      case "move": {
        if (this.phase !== "play") return { err: "phase" };
        if (this.s.turn !== i + 1) return { err: "not-turn" };
        if (!Number.isInteger(m.r) || !Number.isInteger(m.c)) return { err: "bad" };
        return this.doMove(m.r, m.c, false) ? { ok: true } : { err: "illegal" };
      }
      case "chat": { // người gửi = ghế i do máy chủ biết từ kết nối; client chỉ gửi nội dung
        const me = this.players[i];
        const r = this.chat.post(me, m.text, this.players.filter((x) => x.ip === me.ip).length);
        if (r.ok) this.changed();
        return r;
      }
      default: return { err: "bad" };
    }
  }

  doMove(r, c, auto) {
    const p = this.s.turn, n = this.L.play(this.s, r, c);
    if (!n) return false;
    this.s = n; this.seq++; this.lastAct = { r, c, p, auto: !!auto };
    if (n.winner) this.phase = "over";
    this.schedule(); this.changed();
    return true;
  }

  /** Hẹn giờ máy chủ đánh thay. fresh=true khi bắt đầu một nước mới; false khi chỉ đổi kết nối — khi đó hạn chỉ có thể ngắn lại. */
  schedule(fresh = true) {
    this.clock.clearTimeout(this.timer); this.timer = null; this.deadline = 0;
    if (this.phase !== "play" || this.closed) return;
    const now = this.clock.now(), who = this.players[this.s.turn - 1];
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
    const mv = this.A.bestMove(this.s, "hard");
    if (!mv || !this.doMove(mv[0], mv[1], true)) { // không tìm được nước (không nên xảy ra) → ô trống đầu tiên
      const k = this.s.board.indexOf(0);
      if (k >= 0) this.doMove(Math.floor(k / this.s.size), k % this.s.size, true);
    }
  }

  changed() { if (!this.closed) this.onChange(); }

  close() { this.closed = true; this.clock.clearTimeout(this.timer); this.timer = null; }

  /** Góc nhìn gửi cho người thứ i. Caro không có thông tin ẩn — chỉ bỏ token của mọi người. */
  viewFor(i) {
    const s = this.s;
    return {
      code: this.code, phase: this.phase, you: i, host: this.hostSeat, size: this.size, rule: this.rule,
      gid: this.gid, seq: this.seq, act: this.lastAct, deadline: this.deadline, oppLeft: !!this.oppLeft,
      players: this.players.map((p) => ({ name: p.name, connected: p.connected })),
      chat: this.chat.view(this.players[i]?.token),
      game: s && { size: s.size, rule: s.rule, score: s.score, round: s.round, first: s.first, turn: s.turn, moves: s.moves, winner: s.winner, line: s.line },
    };
  }
}

module.exports = { Room, DEFAULT_TIMINGS, MAX_PLAYERS, cleanName };
