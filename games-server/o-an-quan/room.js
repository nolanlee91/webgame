"use strict";
const { play, newGame } = require("./logic");

class Room {
  constructor({ code, size, onChange }) {
    this.code = code;
    this.max = size === 4 ? 4 : 2;
    this.onChange = onChange;
    this.players = [];
    this.host = 0;
    this.phase = "lobby";
    this.game = newGame();
    this.turn = 0;
    this.revision = 0;
  }

  join(name, token) {
    if (this.phase !== "lobby" || this.players.length >= this.max) return { err: "full" };
    this.players.push({ name: (typeof name === "string" ? name.trim().slice(0, 22) : "") || "Người chơi", token, connected: true });
    return {};
  }

  setConnected(i, connected) {
    this.players[i].connected = connected;
    this.onChange();
  }

  leave(i) {
    if (this.phase === "playing") {
      this.phase = "over";
      this.winner = 1 - i % 2;
      this.forfeit = true;
    }
    if (this.phase === "lobby") this.players.splice(i, 1);
    else {
      this.players[i].token = null;
      this.players[i].connected = false;
      this.players[i].left = true;
    }
    this.host = this.players.findIndex((p) => p.token);
    this.closed = this.host < 0;
    this.onChange();
  }

  close() { this.closed = true; }

  viewFor(you) {
    return {
      code: this.code, phase: this.phase, you, host: this.host, max: this.max, turn: this.turn,
      players: this.players.map(({ name, connected, left }) => ({ name, connected, left })),
      game: this.game, last: this.last, winner: this.winner, forfeit: this.forfeit, revision: this.revision,
    };
  }

  handle(i, msg) {
    if (msg.t === "start") {
      if (i !== this.host) return { err: "not-host" };
      if (this.phase === "playing") return { err: "phase" };
      if (this.players.length !== this.max || !this.players.every((p) => p.connected)) return { err: "waiting" };
      this.phase = "playing";
      this.game = newGame();
      this.turn = 0;
      this.last = null;
      this.winner = null;
      this.forfeit = false;
    } else if (msg.t === "move") {
      if (this.phase !== "playing" || !this.players.every((p) => p.connected)) return { err: "waiting" };
      if (i !== this.turn || msg.revision !== this.revision) return { err: "turn" };
      const result = play(this.game, i % 2, msg.cell, msg.dir);
      if (!result) return { err: "move" };
      this.last = { ...result, cell: msg.cell, by: i, dir: msg.dir };
      if (result.over) {
        this.phase = "over";
        const [a, b] = this.game.scores;
        this.winner = a === b ? null : Number(b > a);
      } else this.turn = (this.turn + 1) % this.max;
    } else return { err: "bad" };
    this.revision++;
    this.onChange();
    return {};
  }
}

module.exports = { Room };
