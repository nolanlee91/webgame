// Phòng Cờ Vua online 1v1 — máy chủ là nguồn sự thật duy nhất.
// Luật lấy NGUYÊN từ prototype/games/co-vua/logic.js (truyền vào qua `L`), máy đi thay lấy từ ai.js (`A`) — không chép lại luật.
// Client chỉ gửi Ý ĐỊNH ("đi quân từ ô a sang ô b, phong cấp thành x"); máy chủ kiểm tra đúng người / đúng lượt /
// nước hợp lệ theo luật đầy đủ (kể cả không để Vua bị chiếu, nhập thành, qua đường, phong cấp) rồi mới áp dụng.
// Ván 1: chủ phòng cầm Trắng; mỗi ván sau hai người đổi màu (logic.js lo việc này qua s.white).
"use strict";
const { Chat } = require("./chat");

const MAX_PLAYERS = 2;
const DEFAULT_TIMINGS = {
  turn: 60000,    // người đang có lượt không đi → máy chủ đi thay để ván không treo
  away: 15000,    // người có lượt đang mất kết nối → đi thay sớm hơn
};
const AUTO_LEVEL = "normal"; // mức bot khi đi thay: đủ hợp lý mà vẫn nhanh (không chặn máy chủ)

// Tên: bộ lọc dùng chung games-server/moderation.js — bỏ ký tự điều khiển / vô hình / bidi và < >, cắt 16 ký tự thật
// (không cắt đôi emoji), dính từ tục hoặc link ⇒ dùng tên thay thế `fallback` (không bao giờ lưu / phát tên gốc).
const { cleanPlayerName } = require("../moderation");
function cleanName(raw, fallback) { return cleanPlayerName(raw, fallback); }

class Room {
  constructor({ code, L, A, clock, onChange, timings }) {
    this.code = code; this.L = L; this.A = A; this.clock = clock;
    this.onChange = onChange || (() => {});
    this.t = { ...DEFAULT_TIMINGS, ...(timings || {}) };
    this.players = [];     // theo thứ tự vào phòng: { token, ip, name, connected }
    this.phase = "lobby";  // lobby → play → over → (again) play …; có người rời giữa trận → về lobby chờ người mới
    this.s = null;         // trạng thái logic.js của ván đang chơi
    this.gid = 0;          // số thứ tự trận/ván (đổi khi bắt đầu / ván tiếp / về phòng chờ)
    this.seq = 0;          // số nước đã đi trong ván — client dùng để phát hiện thiếu gói
    this.lastAct = null;   // nước vừa đi { from, to, auto }
    this.drawOffer = -1;   // ghế đang đề nghị hòa (-1 = không có)
    this.offerSeq = [-1, -1]; // seq lúc mỗi ghế đề nghị hòa lần cuối — mỗi nước chỉ được đề nghị 1 lần (chống spam)
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

  resetRound() { this.gid++; this.seq = 0; this.lastAct = null; this.drawOffer = -1; this.offerSeq = [-1, -1]; }

  /** Rời phòng. Trận 1v1 không chơi tiếp được với 1 người → về phòng chờ, người còn lại làm chủ phòng, chờ người mới. */
  leave(i) {
    if (!this.players[i]) return;
    this.chat.forget(this.players[i].token);
    this.players.splice(i, 1);
    if (!this.players.length) return this.close();
    if (this.phase !== "lobby") { this.phase = "lobby"; this.s = null; this.resetRound(); this.oppLeft = true; }
    this.schedule();
    this.changed();
  }

  setConnected(i, on) {
    const p = this.players[i]; if (!p || p.connected === on) return;
    p.connected = on;
    // chỉ người đang có lượt mới làm đổi hạn chờ, và hạn không bao giờ dài quá hạn gốc của nước đi (chống kéo dài lượt)
    if (this.phase === "play" && this.turnSeat() === i) this.schedule(false);
    this.changed();
  }

  turnSeat() { return this.s ? this.L.seatOf(this.s, this.s.turn) : -1; }

  handle(i, m) {
    if (this.closed) return { err: "no-room" };
    if (!this.players[i]) return { err: "no-seat" };
    switch (m.t) {
      case "start":
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        if (this.players.length < 2) return { err: "need-2" };
        this.s = this.L.newMatch({ mode: "pvp" });
        this.phase = "play"; this.resetRound(); this.oppLeft = false;
        this.schedule(); this.changed(); return { ok: true };
      case "again":
        if (this.phase !== "over") return { err: "phase" };
        if (this.players.length < 2) return { err: "need-2" };
        this.s = this.L.nextRound(this.s);
        this.phase = "play"; this.resetRound();
        this.schedule(); this.changed(); return { ok: true };
      case "move": {
        if (this.phase !== "play") return { err: "phase" };
        if (this.turnSeat() !== i) return { err: "not-turn" };
        if (!Number.isInteger(m.from) || !Number.isInteger(m.to)) return { err: "bad" };
        if (m.promo != null && !this.L.PROMOS.includes(m.promo)) return { err: "bad" };
        return this.doMove({ from: m.from, to: m.to, promo: m.promo == null ? undefined : m.promo }, false) ? { ok: true } : { err: "illegal" };
      }
      case "resign": {
        if (this.phase !== "play") return { err: "phase" };
        return this.end(this.L.resign(this.s, this.L.colorOfSeat(this.s, i)));
      }
      case "draw": { // đề nghị hòa; nếu đối thủ đang đề nghị thì đây là đồng ý
        if (this.phase !== "play") return { err: "phase" };
        if (this.drawOffer === 1 - i) return this.end(this.L.agreeDraw(this.s));
        if (this.drawOffer === i) return { ok: true };
        if (this.offerSeq[i] === this.seq) return { err: "draw-wait" };
        this.drawOffer = i; this.offerSeq[i] = this.seq;
        this.changed(); return { ok: true };
      }
      case "draw-no": { // từ chối (người được mời) hoặc rút lại (người mời)
        if (this.phase !== "play" || this.drawOffer < 0) return { err: "phase" };
        this.drawOffer = -1; this.changed(); return { ok: true };
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

  end(n) {
    if (!n) return { err: "phase" };
    this.s = n; this.phase = "over"; this.drawOffer = -1;
    this.schedule(); this.changed();
    return { ok: true };
  }

  doMove(mv, auto) {
    const n = this.L.play(this.s, mv);
    if (!n) return false;
    this.s = n; this.seq++; this.lastAct = { from: mv.from, to: mv.to, auto: !!auto };
    this.drawOffer = -1; // đi một nước = không nhận lời đề nghị hòa đang treo
    if (n.result) this.phase = "over";
    this.schedule(); this.changed();
    return true;
  }

  /** Hẹn giờ máy chủ đi thay. fresh=true khi bắt đầu một nước mới; false khi chỉ đổi kết nối — khi đó hạn chỉ có thể ngắn lại. */
  schedule(fresh = true) {
    const prev = this.deadline;
    this.clock.clearTimeout(this.timer); this.timer = null; this.deadline = 0;
    if (this.phase !== "play" || this.closed) return;
    const now = this.clock.now(), who = this.players[this.turnSeat()];
    if (fresh || this.actAt == null) this.actAt = now;
    let end = this.actAt + this.t.turn;
    if (who && !who.connected) end = Math.min(end, now + this.t.away);
    if (!fresh && prev > 0) end = Math.min(end, prev); // vào lại không được nới hạn đã rút ngắn lúc rớt mạng
    this.deadline = end;
    this.timer = this.clock.setTimeout(() => this.timeout(), Math.max(0, end - now));
    this.timer?.unref?.();
  }

  timeout() {
    this.timer = null;
    if (this.phase !== "play" || this.closed) return;
    const mv = this.A.bestMove(this.s, AUTO_LEVEL);
    if (!mv || !this.doMove(mv, true)) { // không nên xảy ra (ván chưa xong luôn còn nước) → nước hợp lệ đầu tiên
      const any = this.L.legalMoves(this.s)[0];
      if (any) this.doMove(any, true);
    }
  }

  changed() { if (!this.closed) this.onChange(); }

  close() { this.closed = true; this.clock.clearTimeout(this.timer); this.timer = null; }

  /** Góc nhìn gửi cho người thứ i. Cờ vua không có thông tin ẩn — chỉ bỏ token/ip của mọi người. */
  viewFor(i) {
    const s = this.s;
    return {
      code: this.code, phase: this.phase, you: i, host: this.hostSeat,
      gid: this.gid, seq: this.seq, act: this.lastAct, deadline: this.deadline, oppLeft: !!this.oppLeft, drawOffer: this.drawOffer,
      canOffer: !!s && this.phase === "play" && this.offerSeq[i] !== this.seq,
      players: this.players.map((p) => ({ name: p.name, connected: p.connected })),
      chat: this.chat.view(this.players[i]?.token),
      game: s && { round: s.round, white: s.white, score: s.score, draws: s.draws, turn: s.turn, result: s.result,
        moves: s.moves.map((m) => (m.promo ? [m.from, m.to, m.promo] : [m.from, m.to])) },
    };
  }
}

module.exports = { Room, DEFAULT_TIMINGS, MAX_PLAYERS, cleanName };
