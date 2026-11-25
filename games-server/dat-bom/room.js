// Phòng Đặt Bom online — máy chủ là nguồn sự thật cho bom, lửa, gạch, vật phẩm, sống/chết và điểm.
// Luật lấy NGUYÊN từ prototype/games/dat-bom/logic.js (truyền vào qua `L`, không chép lại luật).
// Client gửi: vị trí mới của mình (máy chủ kiểm tra tốc độ + va chạm), "đặt bom", chat. Mọi thứ khác máy chủ tự tính
// trong vòng lặp 20 nhịp/giây và phát khung trạng thái ván ({t:"f"}) cho cả phòng.
"use strict";
const { Chat } = require("./chat");

const MAX_PLAYERS = 4;
const TICK_MS = 50;

// Tên: bộ lọc dùng chung games-server/moderation.js — bỏ ký tự điều khiển / vô hình / bidi và < >, cắt 16 ký tự thật
// (không cắt đôi emoji), dính từ tục hoặc link ⇒ dùng tên thay thế `fallback` (không bao giờ lưu / phát tên gốc).
const { cleanPlayerName } = require("../moderation");
function cleanName(raw, fallback) { return cleanPlayerName(raw, fallback); }

class Room {
  constructor({ code, L, clock, rand, onChange, onFrame, rules, tickMs }) {
    this.code = code; this.L = L; this.clock = clock; this.rand = rand;
    this.onChange = onChange || (() => {});
    this.onFrame = onFrame || (() => {});
    this.rules = rules || null;
    this.tickMs = tickMs || TICK_MS;
    this.players = [];     // { token, ip, name, connected, left, wins }
    this.phase = "lobby";  // lobby → play → over → (again) play … / (host) lobby
    this.public = false;   // phòng công khai: hiện trong danh sách "Phòng đang chờ"
    this.g = null;
    this.gid = 0;
    this.result = null;
    this.timer = null;
    this.closed = false;
    this.chat = new Chat(clock);
  }

  get hostSeat() { return this.players.findIndex((p) => !p.left); }
  get seated() { return this.players.filter((p) => !p.left).length; }

  join(name, token, ip = "") {
    if (this.closed) return { err: "no-room" };
    if (this.phase !== "lobby") return { err: "started" };
    if (this.players.length >= MAX_PLAYERS) return { err: "full" };
    this.players.push({ token, ip, name: cleanName(name, "Người " + (this.players.length + 1)), connected: true, left: false, wins: 0 });
    this.changed();
    return { ok: true };
  }

  leave(i) {
    const p = this.players[i]; if (!p) return;
    this.chat.forget(p.token);
    if (this.phase === "lobby") this.players.splice(i, 1);
    else {
      p.left = true; p.connected = false; p.token = null;
      if (this.phase === "play") { this.L.kill(this.g, i, this.clock.now()); if (this.g.over) this.finish(); }
    }
    if (!this.players.some((x) => !x.left)) return this.close();
    this.changed();
  }

  setConnected(i, on) {
    const p = this.players[i]; if (!p || p.left || p.connected === on) return;
    p.connected = on; this.changed();
  }

  /** bỏ hẳn ghế của người đã rời (chỉ làm khi không có ván đang chạy — chỉ số ghế không còn dùng cho ván cũ) */
  prune() { this.players = this.players.filter((p) => !p.left); }

  handle(i, m) {
    if (this.closed) return { err: "no-room" };
    const p = this.players[i]; if (!p || p.left) return { err: "no-seat" };
    const now = this.clock.now();
    switch (m.t) {
      case "mv": {
        if (this.phase !== "play") return { ok: true };
        if (this.L.tryMove(this.g, i, Number(m.x), Number(m.y), m.d, now)) return { ok: true };
        const q = this.g.players[i];
        return { fix: { x: q.x, y: q.y, alive: q.alive } };
      }
      case "bomb":
        if (this.phase !== "play") return { err: "phase" };
        // client gửi kèm vị trí mới nhất để quả bom rơi đúng ô người chơi đang thấy
        if (m.x != null) this.L.tryMove(this.g, i, Number(m.x), Number(m.y), m.d, now);
        return this.L.placeBomb(this.g, i, now) ? { ok: true } : { err: "no-bomb" };
      case "public":
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        this.public = !!m.on; this.changed(); return { ok: true };
      case "start":
        if (this.phase !== "lobby") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        if (this.players.length < 2) return { err: "need-2" };
        this.newGame(); return { ok: true };
      case "again":
        if (this.phase !== "over") return { err: "phase" };
        if (this.seated < 2) return { err: "need-2" };
        this.prune(); this.newGame(); return { ok: true };
      case "lobby": // chủ phòng đưa cả phòng về phòng chờ (để mời thêm người)
        if (this.phase !== "over") return { err: "phase" };
        if (i !== this.hostSeat) return { err: "not-host" };
        this.prune(); this.phase = "lobby"; this.g = null; this.result = null; this.changed(); return { ok: true };
      case "chat": { // người gửi = ghế i do máy chủ biết từ kết nối; client chỉ gửi nội dung
        const r = this.chat.post(p, m.text, this.players.filter((x) => !x.left && x.ip === p.ip).length);
        if (r.ok) this.changed();
        return r;
      }
      default: return { err: "bad" };
    }
  }

  newGame() {
    this.g = this.L.createGame({ players: this.players.length, rand: this.rand, now: this.clock.now(), rules: this.rules });
    this.phase = "play"; this.gid++; this.result = null;
    this.changed();
    this.step();
  }

  step() {
    this.clock.clearTimeout(this.timer); this.timer = null;
    if (this.closed || this.phase !== "play") return;
    this.L.tick(this.g, this.clock.now(), this.rand);
    if (this.g.over) return this.finish();
    this.onFrame(this.frame());
    this.timer = this.clock.setTimeout(() => this.step(), this.tickMs);
    this.timer?.unref?.();
  }

  finish() {
    const g = this.g;
    this.clock.clearTimeout(this.timer); this.timer = null;
    this.phase = "over";
    if (g.winner >= 0 && this.players[g.winner]) this.players[g.winner].wins++;
    this.result = {
      winner: g.winner, draw: g.draw, reason: g.reason,
      stats: g.players.map((q) => ({ score: q.score, kills: q.kills, bricks: q.bricks, alive: q.alive })),
    };
    this.onFrame(this.frame());
    this.changed();
  }

  /** Khung trạng thái ván — giống nhau cho mọi người (Đặt Bom không có thông tin ẩn). Gọn để gửi 20 lần/giây. */
  frame() {
    const g = this.g, W = this.L.W, now = this.clock.now();
    const ev = g.ev; g.ev = [];
    return JSON.stringify({
      t: "f", now, gid: this.gid, s: g.startAt, e: g.endAt, over: g.over,
      g: g.grid.join(""),
      b: g.bombs.map((b) => [b.x, b.y, b.owner, b.at, b.range, b.pass]),
      fl: [...g.flames.keys()].map((k) => [k % W, (k / W) | 0]),
      it: [...g.items].map(([k, v]) => [k % W, (k / W) | 0, v]),
      p: g.players.map((q) => [q.x, q.y, q.dir, q.alive ? 1 : 0, q.bombs, q.range, q.speed, q.score, q.kills]),
      ev,
    });
  }

  changed() { if (!this.closed) this.onChange(); }

  close() { this.closed = true; this.clock.clearTimeout(this.timer); this.timer = null; }

  viewFor(i) {
    return {
      code: this.code, phase: this.phase, public: this.public, you: i, host: this.hostSeat, gid: this.gid,
      players: this.players.map((p) => ({ name: p.name, connected: p.connected, left: p.left, wins: p.wins })),
      chat: this.chat.view(this.players[i]?.token),
      result: this.result,
    };
  }
}

module.exports = { Room, MAX_PLAYERS, TICK_MS, cleanName };
