// Phòng Cờ Tỷ Phú online (2–4 người) — máy chủ là nguồn sự thật duy nhất.
// Luật lấy NGUYÊN từ prototype/games/co-ty-phu/logic.js (truyền vào qua `L`, không chép lại luật).
// Client chỉ gửi Ý ĐỊNH ("gieo", "nộp phạt ra tù", "mua / bỏ qua"); máy chủ kiểm tra đúng người / đúng pha,
// tự gieo xúc xắc bằng crypto. RNG có seed của logic.js (bộ bài Kèo, thưởng Bến Xe) được gieo hạt bằng crypto và
// KHÔNG BAO GIỜ gửi xuống client (không gửi rng / seed / thứ tự bộ bài) → không ai đoán trước được lá Kèo sắp rút.
"use strict";
const { Chat } = require("./chat");

const MAX_PLAYERS = 4;
const BOT_NAMES = ["Bot Tèo", "Bot Mận", "Bot Tí", "Bot Sửu"];
const DEFAULT_TIMINGS = {
  turn: 25000,   // người đang có lượt không thao tác → máy chủ làm thay (gieo / tự quyết mua như máy)
  away: 8000,    // người có lượt đang mất kết nối → làm thay sớm hơn
  left: 1200,    // người đã rời ván → máy chủ chơi thay gần như ngay
  bot: 900,      // ghế bot (chủ phòng thêm ở phòng chờ) đi sau khi hoạt ảnh xong ~0,9 s
  anim: 1,       // hệ số thời gian chờ client phát xong hoạt ảnh của nước vừa đi (test đặt 0)
};

// Thời gian (ms) client phát hoạt ảnh mỗi sự kiện — khớp playOne() trong prototype/games/co-ty-phu/game.js.
// Hạn lượt kế tiếp chỉ bắt đầu tính sau khi mọi người đã xem xong (không bị "ăn" mất giờ vì hoạt ảnh).
function animMs(events) {
  let ms = 450;
  for (const e of events) {
    switch (e.type) {
      case "roll": ms += 840; break;
      case "move": ms += e.path.length * 150 + 120; break;
      case "jump": ms += 400; break;
      case "passStart": ms += 650; break;
      case "buy": case "upgrade": case "bonus": case "jailed": case "stayJail": ms += 800; break;
      case "skip": ms += 450; break;
      case "cantAfford": case "note": ms += 700; break;
      case "rent": ms += 250; break;
      case "pay": ms += e.to != null ? 600 : 400; break;
      case "gain": ms += 300; break;
      case "card": ms += 2300; break;
      case "freed": case "sellHouse": case "sellLand": ms += 600; break;
      case "bankrupt": ms += 1400; break;
    }
  }
  return Math.min(ms, 20000);
}

// Tên: bộ lọc dùng chung games-server/moderation.js — bỏ ký tự điều khiển / vô hình / bidi và < >, cắt 16 ký tự thật
// (không cắt đôi emoji), dính từ tục hoặc link ⇒ dùng tên thay thế `fallback` (không bao giờ lưu / phát tên gốc).
const { cleanPlayerName } = require("../moderation");
function cleanName(raw, fallback) { return cleanPlayerName(raw, fallback); }

class Room {
  constructor({ code, L, clock, randInt, onChange, timings }) {
    this.code = code; this.L = L; this.clock = clock; this.randInt = randInt;
    this.onChange = onChange || (() => {});
    this.t = { ...DEFAULT_TIMINGS, ...(timings || {}) };
    this.players = [];     // theo thứ tự vào phòng: { token, ip, name, tok (quân 0..3), connected, left }
    this.phase = "lobby";  // lobby → play → over → (về phòng chờ) lobby …
    this.g = null;         // trạng thái logic.js của ván đang chơi
    this.gid = 0;          // số thứ tự ván
    this.seq = 0;          // số thứ tự hành động trong ván — client dùng để phát hiện lệch / thiếu gói
    this.events = [];      // sự kiện của hành động vừa làm (client phát lại để có hoạt ảnh)
    this.deadline = 0;
    this.timer = null;
    this.actAt = null;
    this.closed = false;
    this.chat = new Chat(clock);
  }

  get hostSeat() { return this.players.findIndex((p) => !p.left && !p.bot); }
  humans() { return this.players.filter((p) => !p.left && !p.bot); }

  freeToken() { for (let k = 0; k < 4; k++) if (!this.players.some((p) => p.tok === k)) return k; return -1; }

  join(name, token, ip = "") {
    if (this.closed) return { err: "no-room" };
    if (this.phase !== "lobby") return { err: "started" };
    if (this.players.length >= MAX_PLAYERS) return { err: "full" };
    this.players.push({ token, ip, name: cleanName(name, "Người " + (this.players.length + 1)), tok: this.freeToken(), connected: true, left: false });
    this.changed();
    return { ok: true };
  }

  leave(i) {
    const p = this.players[i]; if (!p) return;
    this.chat.forget(p.token);
    if (this.phase === "lobby") this.players.splice(i, 1);
    else { p.left = true; p.connected = false; p.token = null; }
    if (!this.humans().length) return this.close(); // chỉ còn bot ⇒ đóng phòng
    if (this.phase === "play" && this.g.turn === i) this.schedule(false);
    this.changed();
  }

  setConnected(i, on) {
    const p = this.players[i]; if (!p || p.left || p.bot || p.connected === on) return;
    p.connected = on;
    // chỉ người đang có lượt mới làm đổi hạn chờ, và hạn chỉ có thể NGẮN lại (vào lại không nới hạn đã rút)
    if (this.phase === "play" && this.g.turn === i) this.schedule(false);
    this.changed();
  }

  handle(i, m) {
    if (this.closed) return { err: "no-room" };
    const p = this.players[i]; if (!p || p.left || p.bot) return { err: "no-seat" };
    switch (m.t) {
      case "add-bot": { // chủ phòng lấp ghế trống bằng bot (máy chủ chơi thay ghế đó)
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        if (this.players.length >= MAX_PLAYERS) return { err: "full" };
        const name = BOT_NAMES.find((n) => !this.players.some((x) => x.name === n)) || "Bot";
        this.players.push({ token: null, ip: "", name, tok: this.freeToken(), connected: true, left: false, bot: true });
        this.changed(); return { ok: true };
      }
      case "kick-bot": {
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        if (!this.players[m.seat]?.bot) return { err: "target" };
        this.players.splice(m.seat, 1); this.changed(); return { ok: true };
      }
      case "token": { // đổi linh vật trong phòng chờ (không trùng người khác)
        if (this.phase !== "lobby") return { err: "phase" };
        if (!Number.isInteger(m.tok) || m.tok < 0 || m.tok > 3) return { err: "bad" };
        if (this.players.some((x, k) => k !== i && x.tok === m.tok)) return { err: "taken" };
        p.tok = m.tok; this.changed(); return { ok: true };
      }
      case "start":
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        if (this.players.length < 2) return { err: "need-2" }; // người + bot đều tính
        this.newGame(); return { ok: true };
      case "lobby": // ván đã xong → cả phòng về phòng chờ (người đã rời bị bỏ khỏi danh sách)
        if (this.phase !== "over") return { err: "phase" };
        this.toLobby(); return { ok: true };
      case "roll": case "jail": case "decide": {
        if (this.phase !== "play") return { err: "phase" };
        if (this.g.turn !== i) return { err: "not-turn" };
        const g = this.g, L = this.L;
        if (m.t === "roll") { if (g.phase !== "roll") return { err: "phase" }; this.doRoll(); return { ok: true }; }
        if (m.t === "jail") {
          if (!L.payJail(g)) return { err: "illegal" };
          this.after(); return { ok: true };
        }
        if (typeof m.yes !== "boolean") return { err: "bad" };
        if (!L.decide(g, m.yes)) return { err: "phase" };
        this.after(); return { ok: true };
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
    const g = L.createGame({ players: n, human: null, seed: this.randInt(0x7fffffff) + 1 });
    g.players.forEach((gp, k) => { gp.name = this.players[k].name; gp.token = this.players[k].tok; gp.bot = false; });
    L.drainEvents(g);
    this.g = g; this.phase = "play"; this.gid++; this.seq = 0; this.events = [];
    this.schedule(true, 0); this.changed();
  }

  toLobby() {
    this.clock.clearTimeout(this.timer); this.timer = null; this.deadline = 0;
    this.players = this.players.filter((p) => !p.left);
    this.phase = "lobby"; this.g = null; this.events = []; this.seq = 0;
    this.changed();
  }

  doRoll() {
    const dice = [1 + this.randInt(6), 1 + this.randInt(6)];
    this.L.roll(this.g, dice);
    this.after();
  }

  after() {
    const ev = this.L.drainEvents(this.g);
    this.seq++; this.events = ev;
    if (this.g.phase === "over") { this.phase = "over"; this.clock.clearTimeout(this.timer); this.timer = null; this.deadline = 0; }
    else this.schedule(true, animMs(ev) * this.t.anim);
    this.changed();
  }

  /** Hẹn giờ máy chủ làm thay khi người có lượt im lặng / mất kết nối / đã rời.
   *  fresh=true khi bắt đầu một hành động mới (wait = thời gian hoạt ảnh); false khi chỉ đổi kết nối — hạn chỉ có thể ngắn lại. */
  schedule(fresh = true, wait = 0) {
    const old = this.deadline;
    this.clock.clearTimeout(this.timer); this.timer = null; this.deadline = 0;
    if (this.phase !== "play" || this.closed) return;
    const who = this.players[this.g.turn], now = this.clock.now();
    if (fresh || this.actAt == null) this.actAt = now + wait;
    let end = this.actAt + this.t.turn;
    if (who.left) end = Math.min(end, Math.max(now, this.actAt) + this.t.left);
    else if (who.bot) end = Math.min(end, Math.max(now, this.actAt) + this.t.bot);
    else if (!who.connected) end = Math.min(end, Math.max(now, this.actAt) + this.t.away);
    if (!fresh && old) end = Math.min(end, old);
    this.deadline = end;
    this.timer = this.clock.setTimeout(() => this.timeout(), Math.max(0, end - now));
    this.timer?.unref?.();
  }

  timeout() {
    this.timer = null;
    if (this.phase !== "play" || this.closed) return;
    const g = this.g, L = this.L, who = this.players[g.turn];
    if (g.phase === "roll") {
      if ((who.left || who.bot) && g.players[g.turn].jailed && g.players[g.turn].cash > 400) L.payJail(g); // người đã rời / bot: chơi như máy
      this.doRoll();
    } else if (g.phase === "decide") { L.decide(g, L.botWants(g)); this.after(); }
  }

  changed() { if (!this.closed) this.onChange(); }

  close() { this.closed = true; this.clock.clearTimeout(this.timer); this.timer = null; }

  /** Góc nhìn gửi cho người thứ i: KHÔNG có token / IP của ai, không có rng / seed / bộ bài Kèo. */
  viewFor(i) {
    const g = this.g;
    return {
      code: this.code, phase: this.phase, you: i, host: this.hostSeat,
      gid: this.gid, seq: this.seq, events: this.events, deadline: this.deadline,
      players: this.players.map((p) => ({ name: p.name, tok: p.tok, connected: p.connected, left: p.left, bot: !!p.bot })),
      chat: this.chat.view(this.players[i]?.token),
      game: g && {
        rules: g.rules, turn: g.turn, round: g.round, phase: g.phase, dice: g.dice, pending: g.pending,
        props: g.props, winner: g.winner, endReason: g.endReason, ranking: g.ranking || null,
        players: g.players.map((p) => ({ id: p.id, token: p.token, name: p.name, cash: p.cash, pos: p.pos, jailed: p.jailed, jailTries: p.jailTries, bankrupt: p.bankrupt })),
      },
    };
  }
}

module.exports = { Room, DEFAULT_TIMINGS, MAX_PLAYERS, cleanName, animMs };
