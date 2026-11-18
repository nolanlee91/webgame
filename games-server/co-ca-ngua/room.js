// Phòng Cờ Cá Ngựa online — máy chủ là nguồn sự thật duy nhất.
// Luật lấy NGUYÊN từ prototype/games/co-ca-ngua/logic.js (truyền vào qua `L`, không chép lại luật).
// Client chỉ gửi Ý ĐỊNH ("gieo", "đi ngựa số h"); máy chủ kiểm tra đúng người / đúng pha / nước hợp lệ,
// tự gieo xúc xắc bằng crypto (không dùng RNG có seed của logic.js để không ai đoán trước được mặt xúc xắc).
"use strict";
const { Chat } = require("./chat");

const MAX_PLAYERS = 4;
const DEFAULT_TIMINGS = {
  auto: 1100,     // chỉ 1 nước đi (hoặc toàn xuất ngựa giống nhau) → máy chủ tự đi sau khi xúc xắc lăn xong
  turn: 30000,    // người đang có lượt không thao tác → máy chủ đi thay (gieo / chọn nước khá nhất)
  away: 8000,     // người có lượt đang mất kết nối → đi thay sớm hơn
  left: 1200,     // người đã rời ván → máy chủ đi thay gần như ngay
};

// ký tự điều khiển, ký tự vô hình / đảo chiều chữ (bidi) và dấu < > — dựng từ mã số để file không chứa ký tự vô hình
const hex4 = (c) => "\\" + "u" + c.toString(16).padStart(4, "0");
const BAD_CHARS = new RegExp("[" + [[0, 0x1f], [0x7f, 0x9f], [0x61c, 0x61c], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060, 0x2069], [0xfeff, 0xfeff]].map(([a, b]) => hex4(a) + "-" + hex4(b)).join("") + "<>]", "g");
function cleanName(raw, fallback) {
  const s = String(raw ?? "").replace(BAD_CHARS, "").replace(/\s+/g, " ").trim();
  return [...s].slice(0, 16).join("") || fallback;
}

class Room {
  constructor({ code, L, clock, randInt, onChange, timings }) {
    this.code = code; this.L = L; this.clock = clock; this.randInt = randInt;
    this.onChange = onChange || (() => {});
    this.t = { ...DEFAULT_TIMINGS, ...(timings || {}) };
    this.players = [];     // theo thứ tự vào phòng: { token, name, connected, left }
    this.phase = "lobby";  // lobby → play → over → (again) play …
    this.rule = "6";
    this.g = null;         // trạng thái logic.js của ván đang chơi
    this.gid = 0;          // số thứ tự ván (đổi khi bắt đầu / ván mới)
    this.seq = 0;          // số thứ tự hành động trong ván — client dùng để phát hiện lệch / thiếu gói
    this.lastAct = null;   // hành động vừa làm ra trạng thái hiện tại (client phát lại để có hoạt ảnh)
    this.deadline = 0;
    this.timer = null;
    this.closed = false;
    this.chat = new Chat(clock); // trò chuyện của phòng — sống cùng phòng
  }

  get hostSeat() { return this.players.findIndex((p) => !p.left); }

  join(name, token, ip = "") {
    if (this.closed) return { err: "no-room" };
    if (this.phase !== "lobby") return { err: "started" };
    if (this.players.length >= MAX_PLAYERS) return { err: "full" };
    this.players.push({ token, ip, name: cleanName(name, "Người " + (this.players.length + 1)), connected: true, left: false });
    this.changed();
    return { ok: true };
  }

  leave(i) {
    const p = this.players[i]; if (!p) return;
    this.chat.forget(p.token);
    if (this.phase === "lobby") this.players.splice(i, 1);
    else { p.left = true; p.connected = false; p.token = null; }
    if (!this.players.some((x) => !x.left)) return this.close();
    this.schedule(false);
    this.changed();
  }

  setConnected(i, on) {
    const p = this.players[i]; if (!p || p.left || p.connected === on) return;
    p.connected = on;
    // chỉ người đang có lượt mới làm đổi hạn chờ, và hạn không bao giờ dài quá hạn gốc của hành động (chống kéo dài lượt)
    if (this.phase === "play" && this.g.turn === i) this.schedule(false);
    this.changed();
  }

  /** ghế trên bàn (0..3) của người thứ i khi ván đang chơi */
  boardSeat(i) { return this.g ? this.g.seats[i] : -1; }

  handle(i, m) {
    if (this.closed) return { err: "no-room" };
    const p = this.players[i]; if (!p || p.left) return { err: "no-seat" };
    switch (m.t) {
      case "rule":
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        if (m.rule !== "6" && m.rule !== "16") return { err: "bad" };
        this.rule = m.rule; this.changed(); return { ok: true };
      case "start":
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        if (this.players.length < 2) return { err: "need-2" };
        this.newGame(); return { ok: true };
      case "again":
        if (this.phase !== "over") return { err: "phase" };
        this.newGame(); return { ok: true };
      case "roll":
      case "move": {
        if (this.phase !== "play") return { err: "phase" };
        if (this.g.seats[this.g.turn] !== this.boardSeat(i)) return { err: "not-turn" };
        if (m.t === "roll") return this.doRoll() ? { ok: true } : { err: "phase" };
        if (!Number.isInteger(m.horse)) return { err: "bad" };
        return this.doMove(m.horse) ? { ok: true } : { err: "illegal" };
      }
      case "chat": { // người gửi = ghế i do máy chủ biết từ kết nối; client chỉ gửi nội dung
        const r = this.chat.post(p, m.text, this.players.filter((x) => !x.left && x.ip === p.ip).length);
        if (r.ok) this.changed();
        return r;
      }
      default: return { err: "bad" };
    }
  }

  newGame() {
    const L = this.L, n = this.players.length;
    // seed không dùng (xúc xắc do máy chủ gieo bằng crypto) — đặt 0 để không lộ gì qua trạng thái
    this.g = L.createGame({ players: n, seed: 0, rules: { launchOn: this.rule === "16" ? [1, 6] : [6] } });
    this.phase = "play"; this.gid++; this.seq = 0; this.lastAct = null;
    this.schedule(); this.changed();
  }

  doRoll() {
    const g = this.g; if (g.phase !== "roll") return false;
    const seat = g.seats[g.turn], dice = 1 + this.randInt(6);
    this.L.roll(g, dice);
    this.L.drainEvents(g);
    this.after({ k: "roll", seat, dice });
    return true;
  }

  doMove(horse) {
    const g = this.g; if (g.phase !== "move") return false;
    const seat = g.seats[g.turn];
    if (!this.L.move(g, horse)) return false;
    this.L.drainEvents(g);
    this.after({ k: "move", seat, horse });
    return true;
  }

  after(act) {
    this.seq++; this.lastAct = act;
    if (this.g.phase === "over") this.phase = "over";
    this.schedule(); this.changed();
  }

  /** Hẹn giờ máy chủ tự đi: nước bắt buộc, hoặc người có lượt im lặng / mất kết nối / đã rời. */
  //  fresh=true khi bắt đầu một hành động mới (ván mới / sau mỗi nước); false khi chỉ đổi kết nối — khi đó hạn chỉ có thể ngắn lại.
  schedule(fresh = true) {
    this.clock.clearTimeout(this.timer); this.timer = null; this.deadline = 0;
    if (this.phase !== "play" || this.closed) return;
    const g = this.g, who = this.players[g.turn], now = this.clock.now();
    if (fresh || this.actAt == null) this.actAt = now;
    const forced = g.phase === "move" && (g.moves.length === 1 || g.moves.every((x) => x.kind === "launch"));
    let end;
    if (forced) end = this.actAt + this.t.auto;
    else {
      end = this.actAt + this.t.turn;
      if (who.left) end = Math.min(end, now + this.t.left);
      else if (!who.connected) end = Math.min(end, now + this.t.away);
    }
    const ms = Math.max(0, end - now);
    if (!forced) this.deadline = end;
    this.timer = this.clock.setTimeout(() => this.timeout(), ms);
    this.timer?.unref?.();
  }

  timeout() {
    this.timer = null;
    if (this.phase !== "play" || this.closed) return;
    const g = this.g;
    if (g.phase === "roll") this.doRoll();
    else if (g.phase === "move") this.doMove(this.L.pickMove(g).horse);
  }

  changed() { if (!this.closed) this.onChange(); }

  close() { this.closed = true; this.clock.clearTimeout(this.timer); this.timer = null; }

  /** Góc nhìn gửi cho người thứ i. Cờ cá ngựa không có thông tin ẩn — chỉ bỏ seed/rng và token của người khác. */
  viewFor(i) {
    const g = this.g;
    return {
      code: this.code, phase: this.phase, rule: this.rule, you: i, host: this.hostSeat,
      gid: this.gid, seq: this.seq, act: this.lastAct, deadline: this.deadline,
      players: this.players.map((p, k) => ({ name: p.name, connected: p.connected, left: p.left, seat: g ? g.seats[k] : -1 })),
      chat: this.chat.view(this.players[i]?.token),
      game: g && {
        players: g.players, seats: g.seats, rules: g.rules, turn: g.turn, phase: g.phase, dice: g.dice,
        moves: g.moves, horses: g.horses, winner: g.winner, rolls: g.rolls,
      },
    };
  }
}

module.exports = { Room, DEFAULT_TIMINGS, MAX_PLAYERS, cleanName };
