// Trọng tài một phòng Ma Sói. Thuần logic, không mạng: host.js gắn vào WebSocket.
//
// NGUYÊN TẮC GIỮ BÍ MẬT (phần cần Codex review):
//  1. Vai trò chỉ nằm trong bộ nhớ server (this.players[i].role). Không có trạng thái "toàn ván" nào được gửi đi.
//  2. MỌI thứ gửi cho người chơi đi qua DUY NHẤT viewFor(seat) — bộ lọc theo quyền của ghế đó.
//     Ai thấy vai ai: bản thân; Sói thấy đồng bọn; người đã chết LỘ vai khi chết; hết ván lộ hết.
//  3. Chỉ gửi khi góc nhìn của ghế đó THAY ĐỔI ⇒ dân thường không nhận gói tin nào lúc Sói/Tiên tri/Bảo vệ
//     hành động ban đêm (không lộ qua thời điểm/khối lượng gói tin).
//  4. Pha đêm luôn chạy ĐỦ thời gian (không kết thúc sớm khi mọi người đã chọn) ⇒ không suy ra vai nào đã chết/còn.
//  5. Lỗi trả về chỉ phụ thuộc vai của CHÍNH người gửi, không phụ thuộc vai của mục tiêu.
"use strict";

const ROLES = { wolf: "wolf", seer: "seer", guard: "guard", villager: "villager", hunter: "hunter", witch: "witch", mayor: "mayor", gatekeeper: "gatekeeper" };
const TEAM = Object.fromEntries(Object.values(ROLES).map((role) => [role, role === ROLES.wolf ? "wolf" : "village"]));
const MIN_PLAYERS = 6, MAX_PLAYERS = 8;
const DEFAULT_TIMINGS = { reveal: 6000, night: 30000, dawn: 7000, day: 60000, vote: 20000, verdict: 6000, hunt: 15000 };
const QUICK = ["Tôi là dân!", "Nghi ngờ quá…", "Cứu tôi!", "Đồng ý", "Không phải tôi", "Bỏ phiếu đi!"];
const CHAT_MAX = 200, CHAT_KEEP = 60;
const CHAT_BURST = 5, CHAT_PER_SEC = 1; // chống spam: mỗi người dồn tối đa 5 tin, hồi 1 tin/giây (riêng chat, ngoài giới hạn lệnh chung)

const SPECIAL = [ROLES.hunter, ROLES.witch, ROLES.mayor, ROLES.gatekeeper];
const PAIRS = SPECIAL.flatMap((role, i) => SPECIAL.slice(i + 1).map((other) => [role, other]));

function roleSet(n, variant = 0) {
  const roles = [ROLES.wolf, ROLES.wolf, ROLES.seer, ROLES.guard, ROLES.villager, ROLES.villager];
  if (n === 7) roles.push(SPECIAL[variant]);
  if (n === 8) roles.push(...PAIRS[variant]);
  return roles;
}

function cleanText(s, max) {
  return String(s ?? "").normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, " ")
    .replace(/\s+/g, " ").trim().slice(0, max);
}

class Room {
  /**
   * @param {object} o code, timings, clock {now, setTimeout, clearTimeout}, randInt(n) → 0..n-1 (crypto), onChange()
   */
  constructor(o) {
    this.code = o.code;
    this.t = { ...DEFAULT_TIMINGS, ...(o.timings || {}) };
    this.clock = o.clock;
    this.randInt = o.randInt;
    this.onChange = o.onChange || (() => {});
    this.players = []; // {seat, name, avatar, role, alive, connected, token}
    this.host = null;
    this.phase = "lobby";
    this.round = 0;    // đêm thứ / ngày thứ
    this.endsAt = 0;
    this.timer = null;
    this.chat = [];    // ban ngày, công khai: {seat, text, ts}
    this.wolfChat = []; // chỉ Sói
    this.events = [];  // công khai: {round, kind:'bite'|'peace'|'hang'|'nohang', seat?, role?}
    this.night = null; // {wolfVotes: Map, seer: seat|null, guard: seat|null}
    this.seerLog = []; // chỉ Tiên tri: {round, target, team}
    this.lineup = null;
    this._resetSkills();
    this.votes = new Map();
    this.winner = null;
    this.closed = false;
  }

  _resetSkills() {
    this.lastGuard = null;
    this.witchUsed = false;
    this.gateReport = null;
    this.mayorUsed = false;
    this.hunt = null;
  }

  // ---------- phòng chờ ----------
  get seats() { return this.players.length; }
  join(name, token) {
    if (this.phase !== "lobby") return { err: "started" };
    if (this.players.length >= MAX_PLAYERS) return { err: "full" };
    const nm = cleanText(name, 16);
    if (!nm) return { err: "name" };
    if (this.players.some((p) => p.name.toLowerCase() === nm.toLowerCase())) return { err: "name-taken" };
    const used = new Set(this.players.map((p) => p.avatar));
    const free = [0, 1, 2, 3, 4, 5, 6, 7].filter((a) => !used.has(a));
    const p = { seat: this.players.length, name: nm, avatar: free[this.randInt(free.length)], role: null, alive: true, connected: true, token };
    this.players.push(p);
    if (this.host === null) this.host = p.seat;
    this._changed();
    return { seat: p.seat };
  }
  /** Rời phòng chờ: xoá hẳn và đánh lại số ghế. Đang chơi: chỉ đánh dấu mất kết nối (vẫn trong ván). */
  leave(seat) {
    if (this.phase !== "lobby") return this.setConnected(seat, false);
    this.players.splice(seat, 1);
    this.players.forEach((p, i) => (p.seat = i));
    if (!this.players.length) { this.host = null; this.close(); return; }
    if (this.host === seat) this.host = 0; else if (this.host > seat) this.host--;
    this._changed();
  }
  setConnected(seat, on) {
    const p = this.players[seat]; if (!p || p.connected === on) return;
    p.connected = on;
    if (!on && this.phase === "lobby" && this.host === seat) {
      const next = this.players.find((q) => q.connected); if (next) this.host = next.seat;
    }
    this._changed();
  }

  // ---------- lệnh từ người chơi (seat đã được host.js xác thực bằng token) ----------
  handle(seat, m) {
    const p = this.players[seat];
    if (!p || this.closed) return { err: "gone" };
    switch (m?.t) {
      case "start": return this._start(seat);
      case "act": return this._act(p, m.target);
      case "brew": return this._brew(p, m.enabled);
      case "watch": return this._watch(p, m.enabled);
      case "hunt": return this._hunt(p, m.target);
      case "vote": return this._vote(p, m.target);
      case "chat": return this._chat(p, m.text);
      case "quick": return Number.isInteger(m.id) && QUICK[m.id] ? this._chat(p, QUICK[m.id]) : { err: "bad" };
      case "again": return this._again(seat);
      default: return { err: "bad" };
    }
  }

  _start(seat) {
    if (this.phase !== "lobby") return { err: "phase" };
    if (seat !== this.host) return { err: "not-host" };
    if (this.players.length < MIN_PLAYERS) return { err: "need-players" };
    const size = this.players.length;
    const roles = roleSet(size, size === 6 ? 0 : this.randInt(size === 7 ? SPECIAL.length : PAIRS.length));
    this.lineup = Object.fromEntries(Object.values(ROLES).map((role) => [role, roles.filter((r) => r === role).length]));
    for (let i = roles.length - 1; i > 0; i--) { const j = this.randInt(i + 1); [roles[i], roles[j]] = [roles[j], roles[i]]; }
    this.players.forEach((p, i) => { p.role = roles[i]; p.alive = true; });
    this.round = 0; this.events = []; this.chat = []; this.wolfChat = []; this.seerLog = []; this.winner = null;
    this._resetSkills();
    this._enter("reveal", this.t.reveal);
    return { ok: true };
  }

  _brew(p, enabled) {
    if (this.phase !== "night" || !p.alive || p.role !== ROLES.witch) return { err: "no-action" };
    if (this.witchUsed) return { err: "spent" };
    if (typeof enabled !== "boolean") return { err: "bad" };
    if (enabled === this.night.brew) return { ok: true };
    this.night.brew = enabled;
    this._changed();
    return { ok: true };
  }

  _watch(p, enabled) {
    if (this.phase !== "night" || !p.alive || p.role !== ROLES.gatekeeper) return { err: "no-action" };
    if (this.gateReport) return { err: "spent" };
    if (typeof enabled !== "boolean") return { err: "bad" };
    if (enabled === this.night.watch) return { ok: true };
    this.night.watch = enabled;
    this._changed();
    return { ok: true };
  }

  _hunt(p, target) {
    if (this.hunt?.seat !== p.seat) return { err: "no-action" };
    const q = this._target(target);
    if (q === undefined) return { err: "target" };
    this.hunt.target = q ? q.seat : null;
    this._changed();
    return { ok: true };
  }

  _eliminate(seat, kind, byMayor = false) {
    const p = this.players[seat];
    p.alive = false;
    const event = { round: this.round, kind, seat, role: p.role };
    if (byMayor) event.byMayor = true;
    this.events.push(event);
    if (p.role === ROLES.hunter) this.hunt = { seat, target: null };
  }

  _again(seat) {
    if (this.phase !== "end") return { err: "phase" };
    if (seat !== this.host) return { err: "not-host" };
    // bỏ người đã rời hẳn, về phòng chờ
    this.players = this.players.filter((p) => p.connected);
    this.players.forEach((p, i) => { p.seat = i; p.role = null; p.alive = true; });
    this.host = this.players.length ? 0 : null;
    this.phase = "lobby"; this.round = 0; this.endsAt = 0; this.events = []; this.chat = []; this.wolfChat = []; this.seerLog = [];
    this.lineup = null;
    this._resetSkills();
    this.votes = new Map(); this.night = null; this.winner = null;
    this._changed();
    return { ok: true, reseat: true };
  }

  _target(t) {
    if (t === null || t === undefined) return null;
    if (!Number.isInteger(t)) return undefined;
    const q = this.players[t];
    return q && q.alive ? q : undefined;
  }

  _act(p, target) {
    if (this.phase !== "night") return { err: "phase" };
    if (!p.alive) return { err: "dead" };
    const q = this._target(target);
    if (q === undefined) return { err: "target" };
    const n = this.night;
    if (p.role === ROLES.wolf) {
      if (q && q.role === ROLES.wolf) return { err: "target" }; // lỗi chỉ trả cho Sói, người đã biết đồng bọn
      if (q) n.wolfVotes.set(p.seat, q.seat); else n.wolfVotes.delete(p.seat);
    } else if (p.role === ROLES.seer) {
      if (n.seer !== null) return { err: "done" };
      if (!q || q === p) return { err: "target" };
      n.seer = q.seat;
      this.seerLog.push({ round: this.round, target: q.seat, team: TEAM[q.role] });
    } else if (p.role === ROLES.guard) {
      if (q && q.seat === this.lastGuard) return { err: "same-guard" };
      n.guard = q ? q.seat : null;
    } else return { err: "no-action" };
    this._changed();
    return { ok: true };
  }

  _vote(p, target) {
    if (this.phase !== "vote") return { err: "phase" };
    if (!p.alive) return { err: "dead" };
    const q = this._target(target);
    if (q === undefined || q === p) return { err: "target" };
    this.votes.set(p.seat, q ? q.seat : -1); // -1 = bỏ qua
    this._changed();
    if (this.players.filter((x) => x.alive).every((x) => this.votes.has(x.seat))) this._enter("verdict", this.t.verdict, () => this._resolveVote());
    return { ok: true };
  }

  _chat(p, text) {
    const s = cleanText(text, CHAT_MAX);
    if (!s) return { err: "empty" };
    if (!p.alive) return { err: "dead" };
    const now = this.clock.now();
    if (!["lobby", "day", "vote", "verdict", "dawn", "end"].includes(this.phase) && !(this.phase === "night" && p.role === ROLES.wolf))
      return { err: this.phase === "night" ? "night" : "phase" };
    // xô token riêng của người gửi (không bao giờ đưa vào viewFor) — lỗi chỉ phụ thuộc chính người gửi
    p.chatTok = Math.min(CHAT_BURST, (p.chatTok ?? CHAT_BURST) + ((now - (p.chatAt ?? now)) / 1000) * CHAT_PER_SEC); p.chatAt = now;
    if (p.chatTok < 1) return { err: "chat-slow" };
    p.chatTok -= 1;
    const msg = { seat: p.seat, text: s, ts: now };
    if (this.phase === "night") {
      if (p.role !== ROLES.wolf) return { err: "night" };
      this.wolfChat.push(msg); if (this.wolfChat.length > CHAT_KEEP) this.wolfChat.shift();
    } else if (["lobby", "day", "vote", "verdict", "dawn", "end"].includes(this.phase)) {
      this.chat.push(msg); if (this.chat.length > CHAT_KEEP) this.chat.shift();
    } else return { err: "phase" };
    this._changed();
    return { ok: true };
  }

  // ---------- vòng ngày / đêm ----------
  _enter(phase, ms, then) {
    this.clock.clearTimeout(this.timer);
    this.phase = phase;
    if (then) then.call(this);
    if (this.hunt && (phase === "dawn" || phase === "verdict")) ms += this.t.hunt;
    this.endsAt = ms ? this.clock.now() + ms : 0;
    this.timer = ms ? this.clock.setTimeout(() => this._next(), ms) : null;
    this._changed();
  }

  _next() {
    this.timer = null;
    switch (this.phase) {
      case "reveal": return this._toNight();
      case "night": return this._toDawn();
      case "dawn": return this._afterDeath("day", this.t.day);
      case "day": this.votes = new Map(); return this._enter("vote", this.t.vote);
      case "vote": return this._enter("verdict", this.t.verdict, () => this._resolveVote());
      case "verdict": return this._afterDeath("night");
    }
  }

  _toNight() {
    this.round++;
    this.night = { wolfVotes: new Map(), seer: null, guard: null, brew: false, watch: false };
    this.wolfChat = [];
    this._enter("night", this.t.night);
  }

  _toDawn() {
    const n = this.night;
    // Sói cắn: theo số phiếu đông nhất của các Sói còn sống; hoà ⇒ chọn ngẫu nhiên trong nhóm hoà
    const tally = new Map();
    for (const [w, t] of n.wolfVotes) if (this.players[w].alive && this.players[t]?.alive) tally.set(t, (tally.get(t) || 0) + 1);
    let victim = null;
    if (tally.size) {
      const max = Math.max(...tally.values()), top = [...tally].filter(([, c]) => c === max).map(([t]) => t);
      victim = top[this.randInt(top.length)];
    }
    this.lastGuard = n.guard;
    if (n.watch) {
      const watcher = this.players.find((p) => p.role === ROLES.gatekeeper);
      const seat = watcher.seat;
      // Chỉ tính mục tiêu cuối cùng của bầy Sói, cùng các lượt soi và bảo vệ đã chọn.
      this.gateReport = { round: this.round, targeted: n.guard === seat || n.seer === seat || victim === seat };
    }
    if (victim !== null && victim !== n.guard) {
      if (n.brew) {
        this.witchUsed = true;
        this.events.push({ round: this.round, kind: "peace" });
      } else this._eliminate(victim, "bite");
    } else this.events.push({ round: this.round, kind: "peace" });
    this.night = null;
    this._enter("dawn", this.t.dawn);
  }

  _resolveVote() {
    const tally = new Map();
    for (const [v, t] of this.votes) if (this.players[v].alive) tally.set(t, (tally.get(t) || 0) + 1);
    let hanged = null, byMayor = false;
    if (tally.size) {
      const max = Math.max(...tally.values()), top = [...tally].filter(([, c]) => c === max);
      if (top.length === 1 && top[0][0] !== -1) hanged = top[0][0]; // hoà hoặc "bỏ qua" nhiều nhất ⇒ không treo ai
      if (top.length === 2 && top.every(([target]) => target >= 0) && !this.mayorUsed) {
        const mayor = this.players.find((p) => p.alive && p.role === ROLES.mayor);
        const choice = mayor && this.votes.get(mayor.seat);
        if (top.some(([target]) => target === choice)) {
          hanged = choice;
          this.mayorUsed = true;
          byMayor = true;
        }
      }
    }
    if (hanged !== null) {
      this._eliminate(hanged, "hang", byMayor);
    } else this.events.push({ round: this.round, kind: "nohang" });
  }

  _afterDeath(nextPhase, ms) {
    const target = this.hunt?.target;
    this.hunt = null;
    if (target != null && this.players[target]?.alive) this._eliminate(target, "hunt");
    const w = this._winner();
    if (w) { this.winner = w; return this._enter("end", 0); }
    if (nextPhase === "night") return this._toNight();
    this._enter(nextPhase, ms);
  }

  _winner() {
    const alive = this.players.filter((p) => p.alive);
    const wolves = alive.filter((p) => p.role === ROLES.wolf).length;
    if (wolves === 0) return "village";
    if (wolves >= alive.length - wolves) return "wolf";
    return null;
  }

  close() { this.closed = true; this.clock.clearTimeout(this.timer); this.timer = null; }
  _changed() { this.onChange(); }

  // ---------- GÓC NHÌN: đường duy nhất dữ liệu đi ra khỏi server ----------
  viewFor(seat) {
    const me = this.players[seat];
    if (!me) return null;
    const over = this.phase === "end";
    const iAmWolf = me.role === ROLES.wolf;
    const players = this.players.map((p) => {
      const o = { seat: p.seat, name: p.name, avatar: p.avatar, alive: p.alive, connected: p.connected };
      // ai được thấy vai: chính mình | hết ván | người đã chết (lộ khi chết) | Sói thấy Sói
      if (p.role && (p === me || over || !p.alive || (iAmWolf && p.role === ROLES.wolf))) o.role = p.role;
      return o;
    });
    const v = {
      code: this.code, seat, host: this.host, phase: this.phase, round: this.round,
      endsAt: this.endsAt, min: MIN_PLAYERS, max: MAX_PLAYERS, quick: QUICK,
      players, events: this.events.map((e) => ({ ...e })), chat: this.chat.map((c) => ({ ...c })),
    };
    if (this.lineup) v.lineup = { ...this.lineup };
    if (this.phase === "night" && me.alive && this.night) {
      const n = this.night;
      if (me.role === ROLES.wolf) v.night = { can: "bite", mine: n.wolfVotes.get(seat) ?? null, pack: Object.fromEntries(n.wolfVotes) };
      else if (me.role === ROLES.seer) v.night = { can: "inspect", mine: n.seer };
      else if (me.role === ROLES.guard) v.night = { can: "protect", mine: n.guard, banned: this.lastGuard };
      else if (me.role === ROLES.witch) v.night = { can: "brew", ready: !this.witchUsed, armed: n.brew };
      else if (me.role === ROLES.gatekeeper) v.night = { can: "watch", ready: !this.gateReport, armed: n.watch };
      else v.night = { can: null };
    }
    if (this.hunt?.seat === seat) v.hunt = { target: this.hunt.target };
    if (me.role === ROLES.gatekeeper && this.gateReport) v.gateReport = { ...this.gateReport };
    if (me.role === ROLES.mayor) v.mayorReady = !this.mayorUsed;
    if (iAmWolf && (this.phase === "night" || over)) v.wolfChat = this.wolfChat.map((c) => ({ ...c }));
    if (me.role === ROLES.seer) v.seer = this.seerLog.map((r) => ({ ...r }));
    if (this.phase === "vote" || this.phase === "verdict") v.votes = Object.fromEntries(this.votes); // phiếu treo cổ là công khai
    if (over) v.winner = this.winner;
    return v;
  }
}

module.exports = { Room, ROLES, TEAM, MIN_PLAYERS, MAX_PLAYERS, DEFAULT_TIMINGS, QUICK, roleSet, cleanText };
