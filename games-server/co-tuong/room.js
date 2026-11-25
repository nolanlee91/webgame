// Phòng Cờ Tướng online 1v1 — máy chủ là nguồn sự thật duy nhất.
// Luật lấy NGUYÊN từ prototype/games/co-tuong/logic.js (truyền vào qua `L`), máy đi thay lấy từ ai.js (`A`) — không chép lại luật.
// Client chỉ gửi Ý ĐỊNH ("đi quân từ ô f tới ô to", "xin thua", "cầu hòa"); máy chủ kiểm tra đúng người / đúng lượt / nước hợp lệ.
// Ván 1: người vào trước (chủ phòng) cầm Đỏ (đi trước); mỗi ván sau hai người đổi màu. Điểm tính theo NGƯỜI, không theo màu.
"use strict";
const { Chat } = require("./chat");
const { Rematch, AGAIN_MS } = require("../rematch");

const MAX_PLAYERS = 2;
const DEFAULT_TIMINGS = {
  turn: 60000,    // người đang có lượt không đi → máy chủ đi thay (máy mức "normal") để ván không treo
  away: 15000,    // người có lượt đang mất kết nối → đi thay sớm hơn
  again: AGAIN_MS, // hết ván: một người bấm "Ván tiếp" ⇒ đếm ngược rồi mới mở ván mới (cả phòng bấm ⇒ mở ngay) — ../rematch.js
};

// Tên: bộ lọc dùng chung games-server/moderation.js — bỏ ký tự điều khiển / vô hình / bidi và < >, cắt 16 ký tự thật
// (không cắt đôi emoji), dính từ tục hoặc link ⇒ dùng tên thay thế `fallback` (không bao giờ lưu / phát tên gốc).
const { cleanPlayerName } = require("../moderation");
function cleanName(raw, fallback) { return cleanPlayerName(raw, fallback); }
const GAME_CMDS = new Set(["move", "resign", "draw", "draw-no", "again"]);
const isSq = (k) => Number.isInteger(k) && k >= 0 && k < 90;

class Room {
  constructor({ code, L, A, clock, onChange, timings }) {
    this.code = code; this.L = L; this.A = A; this.clock = clock;
    this.onChange = onChange || (() => {});
    this.t = { ...DEFAULT_TIMINGS, ...(timings || {}) };
    this.players = [];     // theo thứ tự vào phòng: { token, ip, name, connected }
    this.phase = "lobby";  // lobby → play → over → (again) play …; có người rời giữa trận → về lobby chờ người mới
    this.s = null;         // trạng thái logic.js của ván đang chơi (s.score tính theo MÀU — phòng không dùng)
    this.redSeat = 0;      // ghế đang cầm Đỏ ở ván hiện tại
    this.score = [0, 0];   // số ván thắng theo ghế
    this.draws = 0;
    this.round = 0;
    this.drawOffer = -1;   // ghế đang cầu hòa (-1 = không ai)
    this.offerSeq = [-1, -1]; // seq lúc mỗi ghế cầu hòa lần cuối — mỗi nước chỉ được cầu hòa 1 lần (chống spam)
    this.gid = 0;          // số thứ tự ván (đổi khi bắt đầu / ván tiếp / về phòng chờ)
    this.seq = 0;          // số nước đã đi trong ván — client dùng để phát hiện thiếu gói
    this.lastAct = null;   // nước vừa đi { f, t, p, auto }
    this.endBy = null;     // { kind: "resign"|"draw"|"rule", seat }
    this.deadline = 0;
    this.actAt = null;
    this.timer = null;
    this.closed = false;
    this.chat = new Chat(clock); // trò chuyện của phòng — sống cùng phòng
    this.rematch = new Rematch(clock, this.t.again);
  }

  get hostSeat() { return this.players.length ? 0 : -1; }
  sideOfSeat(i) { return i === this.redSeat ? this.L.RED : this.L.BLACK; }
  seatOfSide(side) { return side === this.L.RED ? this.redSeat : 1 - this.redSeat; }

  join(name, token, ip = "") {
    if (this.closed) return { err: "no-room" };
    if (this.phase !== "lobby") return { err: "started" };
    if (this.players.length >= MAX_PLAYERS) return { err: "full" };
    this.players.push({ token, ip, name: cleanName(name, "Người " + (this.players.length + 1)), connected: true });
    this.changed();
    return { ok: true };
  }

  /** Rời phòng. 1v1 không chơi tiếp được với 1 người → về phòng chờ, người còn lại làm chủ phòng, điểm làm lại từ đầu. */
  leave(i) {
    if (!this.players[i]) return;
    this.chat.forget(this.players[i].token);
    this.players.splice(i, 1);
    this.rematch.reset();
    if (!this.players.length) return this.close();
    this.score = [0, 0]; this.draws = 0; this.round = 0; this.redSeat = 0;
    if (this.phase !== "lobby") { this.phase = "lobby"; this.s = null; this.gid++; this.seq = 0; this.lastAct = null; this.endBy = null; this.oppLeft = true; }
    this.drawOffer = -1; this.offerSeq = [-1, -1];
    this.schedule();
    this.changed();
  }

  setConnected(i, on) {
    const p = this.players[i]; if (!p || p.connected === on) return;
    p.connected = on;
    // chỉ người đang có lượt mới làm đổi hạn chờ, và hạn không bao giờ dài quá hạn gốc của nước đi (chống kéo dài lượt)
    if (this.phase === "play" && this.seatOfSide(this.s.turn) === i) this.schedule(false);
    this.changed();
  }

  begin() {
    this.rematch.reset();
    this.round++;
    this.redSeat = (this.round - 1) % 2;          // ván lẻ: chủ phòng cầm Đỏ; ván chẵn: đổi màu
    this.s = this.L.newMatch({ mode: "pvp" });
    this.phase = "play"; this.gid++; this.seq = 0; this.lastAct = null; this.endBy = null;
    this.drawOffer = -1; this.offerSeq = [-1, -1];
    this.schedule(); this.changed();
  }

  handle(i, m) {
    if (this.closed) return { err: "no-room" };
    if (!this.players[i]) return { err: "no-seat" };
    // hết hạn mà callback hẹn giờ chưa kịp chạy → máy chủ đi thay NGAY, không nhận nước trễ
    if (this.phase === "play" && this.deadline && this.clock.now() >= this.deadline) this.timeout();
    // lệnh gắn với một ván (gid) / một nước (seq) cụ thể: gửi từ ván cũ hoặc thế cờ cũ → bỏ, không áp sang ván mới
    if (GAME_CMDS.has(m.t) && m.gid !== undefined && m.gid !== this.gid) return { err: "stale" };
    if (m.t === "move" && m.seq !== undefined && m.seq !== this.seq) return { err: "stale" };
    switch (m.t) {
      case "start":
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        if (this.players.length < 2) return { err: "need-2" };
        this.oppLeft = false;
        this.begin(); return { ok: true };
      case "again": // "tôi sẵn sàng ván tiếp": cả hai sẵn sàng ⇒ mở ngay, không thì đếm ngược (../rematch.js)
        if (this.phase !== "over") return { err: "phase" };
        if (this.players.length < 2) return { err: "need-2" };
        if (this.rematch.vote(this.players[i].token, this.players, () => this.nextRound()) === "wait") this.changed();
        return { ok: true };
      case "move": {
        if (this.phase !== "play") return { err: "phase" };
        if (this.seatOfSide(this.s.turn) !== i) return { err: "not-turn" };
        if (!isSq(m.f) || !isSq(m.to)) return { err: "bad" };
        return this.doMove(m.f, m.to, false) ? { ok: true } : { err: "illegal" };
      }
      case "resign": {
        if (this.phase !== "play") return { err: "phase" };
        const n = this.L.resign(this.s, this.sideOfSeat(i));
        if (!n) return { err: "phase" };
        this.endBy = { kind: "resign", seat: i };
        this.finish(n); return { ok: true };
      }
      case "draw": { // cầu hòa; nếu đối thủ đang cầu hòa thì đây là đồng ý
        if (this.phase !== "play") return { err: "phase" };
        if (this.drawOffer === 1 - i) {
          this.endBy = { kind: "draw", seat: i };
          this.finish(this.L.agreeDraw(this.s)); return { ok: true };
        }
        if (this.drawOffer === i) return { ok: true };
        if (this.offerSeq[i] === this.seq) return { err: "slow" };
        this.drawOffer = i; this.offerSeq[i] = this.seq;
        this.changed(); return { ok: true };
      }
      case "draw-no": { // từ chối lời cầu hòa của đối thủ, hoặc tự rút lại lời cầu hòa của mình
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

  doMove(f, t, auto) {
    const p = this.s.turn, n = this.L.play(this.s, f, t);
    if (!n) return false;
    this.seq++; this.lastAct = { f, t, p, auto: !!auto };
    // đối thủ đi tiếp thay vì trả lời lời cầu hòa = từ chối
    if (this.drawOffer >= 0 && this.seatOfSide(p) !== this.drawOffer) this.drawOffer = -1;
    if (n.winner) { this.endBy = { kind: "rule" }; this.finish(n); return true; }
    this.s = n;
    this.schedule(); this.changed();
    return true;
  }

  /** Mở ván tiếp (rematch.js gọi khi cả hai sẵn sàng hoặc hết đếm ngược) — kiểm lại pha / đủ người. */
  nextRound() {
    if (this.closed || this.phase !== "over" || this.players.length < 2) return;
    this.begin();
  }

  finish(n) {
    this.s = n; this.phase = "over"; this.drawOffer = -1;
    if (n.winner === 3) this.draws++; else this.score[this.seatOfSide(n.winner)]++;
    this.schedule(); this.changed();
  }

  /** Hẹn giờ máy chủ đi thay. fresh=true khi bắt đầu một nước mới; false khi chỉ đổi kết nối — khi đó hạn không bao giờ vượt hạn gốc
 *  (actAt + turn): mất kết nối thì rút về 15 s, nối lại thì trả về hạn gốc chứ không cộng thêm. */
  schedule(fresh = true) {
    this.clock.clearTimeout(this.timer); this.timer = null; this.deadline = 0;
    if (this.phase !== "play" || this.closed) return;
    const now = this.clock.now(), who = this.players[this.seatOfSide(this.s.turn)];
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
    const mv = this.A.bestMove(this.s, "normal");
    if (mv && this.doMove(mv[0], mv[1], true)) return;
    const any = this.L.legalMoves(this.s.board, this.s.turn)[0]; // không nên xảy ra: ván còn tiếp thì luôn còn nước
    if (any) this.doMove(any[0], any[1], true);
  }

  changed() { if (!this.closed) this.onChange(); }

  close() { this.closed = true; this.clock.clearTimeout(this.timer); this.timer = null; this.rematch.reset(); }

  /** Góc nhìn gửi cho người thứ i. Cờ Tướng không có thông tin ẩn — chỉ bỏ token/ip của mọi người. */
  viewFor(i) {
    const s = this.s;
    return {
      code: this.code, phase: this.phase, you: i, host: this.hostSeat,
      gid: this.gid, seq: this.seq, act: this.lastAct, deadline: this.deadline, oppLeft: !!this.oppLeft,
      redSeat: this.redSeat, score: this.score, draws: this.draws, round: this.round,
      drawOffer: this.drawOffer, endBy: this.endBy,
      players: this.players.map((p) => ({ name: p.name, connected: p.connected })),
      again: this.rematch.flags(this.players), againDeadline: this.rematch.deadline, // hết ván: ai đã bấm "Ván tiếp" + hạn tự mở ván mới
      chat: this.chat.view(this.players[i]?.token),
      game: s && { board: s.board.join(""), turn: s.turn, moves: s.moves, check: s.check, winner: s.winner, reason: s.reason },
    };
  }
}

module.exports = { Room, DEFAULT_TIMINGS, MAX_PLAYERS, cleanName };
