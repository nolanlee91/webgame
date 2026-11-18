// Trọng tài một phòng "Ai Là Nội Gián". Thuần logic, không mạng: host.js gắn vào WebSocket.
// Dựng lại theo đúng khung Ma Sói (games-server/ma-soi/room.js, đã qua review độc lập của Codex), đổi chủ đề mật vụ
// và thêm BOT lấp ghế (chủ phòng thêm khi thiếu người).
//
// NGUYÊN TẮC GIỮ BÍ MẬT (phần cần Codex review):
//  1. Vai trò chỉ nằm trong bộ nhớ server (this.players[i].role). Không có trạng thái "toàn ván" nào được gửi đi.
//  2. MỌI thứ gửi cho người chơi đi qua DUY NHẤT viewFor(seat) — bộ lọc theo quyền của ghế đó.
//     Ai thấy vai ai: bản thân; Nội Gián thấy đồng bọn; người đã bị loại LỘ vai khi bị loại; hết ván lộ hết.
//  3. Host chỉ gửi khi góc nhìn của ghế đó THAY ĐỔI ⇒ Đặc Vụ Hiện Trường không nhận gói tin nào lúc Nội Gián/Hacker/
//     Kỹ Sư hành động ban đêm (không lộ qua thời điểm/khối lượng gói tin). Bot là ghế không có kết nối.
//  4. Pha đêm luôn chạy ĐỦ thời gian (không kết thúc sớm khi mọi người đã chọn).
//  5. Lỗi trả về chỉ phụ thuộc vai của CHÍNH người gửi, không phụ thuộc vai của mục tiêu.
//  6. Bot là người chơi bình thường phía server: hành động bằng đúng các hàm _act/_vote/_chat như người thật,
//     không có đường gửi dữ liệu riêng; cờ `bot` (công khai) chỉ cho biết ghế đó là máy.
"use strict";

const ROLES = { mole: "mole", hacker: "hacker", security: "security", agent: "agent", technician: "technician", jammer: "jammer", signal: "signal", courier: "courier" };
const TEAM = Object.fromEntries(Object.values(ROLES).map((role) => [role, [ROLES.mole, ROLES.jammer].includes(role) ? "mole" : "agency"]));
const isMole = (p) => TEAM[p.role] === "mole";
const MIN_PLAYERS = 6, MAX_PLAYERS = 8;
const DEFAULT_TIMINGS = { reveal: 5000, night: 30000, dawn: 10000, day: 60000, vote: 20000, verdict: 6000 };
const QUICK = ["Tôi trong sạch!", "Tín hiệu đáng ngờ", "Xem lại camera!", "Đồng ý", "Không phải tôi", "Bỏ phiếu đi!"];
const BOT_NAMES = ["Bot Cú Mèo", "Bot Radar", "Bot Kính Râm", "Bot Bộ Đàm", "Bot Mật Mã", "Bot Hồ Sơ", "Bot Tín Hiệu", "Bot Còi Hú"];
const CHAT_MAX = 200, CHAT_KEEP = 60;
const CHAT_BURST = 5, CHAT_PER_SEC = 1; // chống spam: mỗi người dồn tối đa 5 tin, hồi 1 tin/giây

const SINGLE = [ROLES.technician, ROLES.jammer, ROLES.courier];
const PAIRS = [
  [ROLES.technician, ROLES.jammer],
  [ROLES.technician, ROLES.courier],
  [ROLES.jammer, ROLES.courier],
  [ROLES.jammer, ROLES.signal],
];

function roleSet(n, variant = 0) {
  const special = n === 8 ? PAIRS[variant] : n === 7 ? [SINGLE[variant]] : [];
  const roles = [ROLES.mole, ROLES.mole, ROLES.hacker, ROLES.security, ROLES.agent, ROLES.agent];
  for (const role of special) {
    if (role === ROLES.jammer) { roles[1] = role; roles.push(ROLES.agent); }
    else roles.push(role);
  }
  return roles;
}

function cleanText(s, max) {
  if (s !== undefined && s !== null && typeof s !== "string") return ""; // object/array lạ ⇒ coi như rỗng, không ép kiểu
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
    this.players = []; // {seat, name, avatar, role, alive, connected, token, bot}
    this.host = null;
    this.phase = "lobby";
    this.round = 0;
    this.endsAt = 0;
    this.timer = null;
    this.botTimers = [];
    this.chat = [];      // ngoài ca đêm, công khai: {seat, text, ts}
    this.moleChat = [];  // kênh mã hoá, chỉ Nội Gián
    this.events = [];    // công khai: {round, kind:'hit'|'safe'|'jail'|'nojail', seat?, role?}
    this.night = null;   // {moleVotes: Map, scan: seat|null, shield: seat|null}
    this.scanLog = [];   // chỉ Hacker Mật: {round, target, team}
    this._resetSkills();
    this.lineup = null;
    this.votes = new Map();
    this.winner = null;
    this.closed = false;
    this.botSeq = 0;
  }

  _resetSkills() {
    this.lastShield = null;
    this.repairUsed = false;
    this.jamUsed = false;
    this.lastScanAudit = null;
    this.signalReport = null;
    this.dispatch = null;
  }

  // ---------- phòng chờ ----------
  get seats() { return this.players.length; }
  _humans() { return this.players.filter((p) => !p.bot); }
  _addPlayer(name, token, bot) {
    const used = new Set(this.players.map((p) => p.avatar));
    const free = [0, 1, 2, 3, 4, 5, 6, 7].filter((a) => !used.has(a));
    const p = { seat: this.players.length, name, avatar: free[this.randInt(free.length)], role: null, alive: true, connected: true, token, bot: !!bot };
    this.players.push(p);
    return p;
  }
  join(name, token) {
    if (this.phase !== "lobby") return { err: "started" };
    if (this.players.length >= MAX_PLAYERS) return { err: "full" };
    const nm = cleanText(name, 16);
    if (!nm) return { err: "name" };
    if (this.players.some((p) => p.name.toLowerCase() === nm.toLowerCase())) return { err: "name-taken" };
    const p = this._addPlayer(nm, token, false);
    if (this.host === null) this.host = p.seat;
    this._changed();
    return { seat: p.seat };
  }
  _reseat() { this.players.forEach((p, i) => (p.seat = i)); }
  _pickHost() {
    const h = this.players.find((q) => !q.bot && q.connected) || this.players.find((q) => !q.bot);
    this.host = h ? h.seat : null;
  }
  /** Rời phòng chờ: xoá hẳn và đánh lại số ghế. Đang chơi: chỉ đánh dấu mất kết nối (vẫn trong ván). */
  leave(seat) {
    if (this.phase !== "lobby") return this.setConnected(seat, false);
    const wasHost = this.host === seat;
    const hostP = this.players[this.host];
    this.players.splice(seat, 1);
    this._reseat();
    if (!this._humans().length) { this.players = []; this.host = null; this.close(); return; } // chỉ còn bot ⇒ đóng phòng
    if (wasHost) this._pickHost(); else this.host = hostP.seat;
    this._changed();
  }
  setConnected(seat, on) {
    const p = this.players[seat]; if (!p || p.bot || p.connected === on) return;
    p.connected = on;
    if (!on && this.phase === "lobby" && this.host === seat) {
      const next = this.players.find((q) => q.connected && !q.bot); if (next) this.host = next.seat;
    }
    this._changed();
  }

  // ---------- lệnh từ người chơi (seat đã được host.js xác thực bằng token) ----------
  handle(seat, m) {
    const p = this.players[seat];
    if (!p || p.bot || this.closed) return { err: "gone" };
    switch (m?.t) {
      case "start": return this._start(seat);
      case "add-bot": return this._addBot(seat);
      case "kick-bot": return this._kickBot(seat, m.target);
      case "act": return this._act(p, m.target);
      case "repair": return this._arm(p, ROLES.technician, "repair", this.repairUsed, m.enabled);
      case "jam": return this._arm(p, ROLES.jammer, "jam", this.jamUsed, m.enabled);
      case "verify": return this._verify(p);
      case "dispatch": return this._dispatch(p, m.target, m.text);
      case "vote": return this._vote(p, m.target);
      case "chat": return this._chat(p, m.text);
      case "quick": return Number.isInteger(m.id) && QUICK[m.id] ? this._chat(p, QUICK[m.id]) : { err: "bad" };
      case "again": return this._again(seat);
      default: return { err: "bad" };
    }
  }

  _addBot(seat) {
    if (this.phase !== "lobby") return { err: "phase" };
    if (seat !== this.host) return { err: "not-host" };
    if (this.players.length >= MAX_PLAYERS) return { err: "full" };
    const taken = new Set(this.players.map((p) => p.name.toLowerCase()));
    const name = BOT_NAMES.find((n) => !taken.has(n.toLowerCase()));
    if (!name) return { err: "full" };
    this._addPlayer(name, `bot-${++this.botSeq}`, true); // token không phải 32 hex ⇒ không ai "resume" vào ghế bot được
    this._changed();
    return { ok: true };
  }

  _kickBot(seat, target) {
    if (this.phase !== "lobby") return { err: "phase" };
    if (seat !== this.host) return { err: "not-host" };
    if (!Number.isInteger(target) || !this.players[target]?.bot) return { err: "target" };
    const hostP = this.players[this.host];
    this.players.splice(target, 1);
    this._reseat();
    this.host = hostP.seat;
    this._changed();
    return { ok: true };
  }

  _start(seat) {
    if (this.phase !== "lobby") return { err: "phase" };
    if (seat !== this.host) return { err: "not-host" };
    if (this.players.length < MIN_PLAYERS) return { err: "need-players" };
    const size = this.players.length;
    const roles = roleSet(size, size === 6 ? 0 : this.randInt(size === 7 ? SINGLE.length : PAIRS.length));
    this.lineup = Object.fromEntries(Object.values(ROLES).map((role) => [role, roles.filter((r) => r === role).length]));
    for (let i = roles.length - 1; i > 0; i--) { const j = this.randInt(i + 1); [roles[i], roles[j]] = [roles[j], roles[i]]; }
    this.players.forEach((p, i) => { p.role = roles[i]; p.alive = true; p.botSeen = null; });
    this.round = 0; this.events = []; this.chat = []; this.moleChat = []; this.scanLog = []; this.winner = null;
    this._resetSkills();
    this._enter("reveal", this.t.reveal);
    return { ok: true };
  }

  _again(seat) {
    if (this.phase !== "end") return { err: "phase" };
    if (seat !== this.host) return { err: "not-host" };
    // bỏ người đã rời hẳn (bot luôn "có mặt"), về phòng chờ
    this.players = this.players.filter((p) => p.connected);
    this.players.forEach((p, i) => { p.seat = i; p.role = null; p.alive = true; p.botSeen = null; });
    this._pickHost();
    this.phase = "lobby"; this.round = 0; this.endsAt = 0; this.events = []; this.chat = []; this.moleChat = []; this.scanLog = [];
    this.lineup = null;
    this._resetSkills();
    this.votes = new Map(); this.night = null; this.winner = null;
    this._clearBots();
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
    if (isMole(p)) {
      if (q && isMole(q)) return { err: "target" }; // đồng bọn đã biết vai của nhau
      if (q) n.moleVotes.set(p.seat, q.seat); else n.moleVotes.delete(p.seat);
    } else if (p.role === ROLES.hacker) {
      if (n.scan !== null) return { err: "done" };
      if (!q || q === p) return { err: "target" };
      n.scan = q.seat;
      if (this.players.length === MIN_PLAYERS) this._recordScan(q, false);
    } else if (p.role === ROLES.security) {
      if (q && q.seat === this.lastShield) return { err: "same-shield" };
      n.shield = q ? q.seat : null;
    } else return { err: "no-action" };
    this._changed();
    return { ok: true };
  }

  _arm(p, role, key, used, enabled) {
    if (this.phase !== "night" || !p.alive || p.role !== role) return { err: "no-action" };
    if (used) return { err: "spent" };
    if (typeof enabled !== "boolean") return { err: "bad" };
    if (enabled === this.night[key]) return { ok: true };
    this.night[key] = enabled;
    this._changed();
    return { ok: true };
  }

  _recordScan(q, jammed) {
    const team = isMole(q) !== jammed ? "mole" : "agency";
    this.scanLog.push({ round: this.round, target: q.seat, team });
    this.lastScanAudit = { round: this.round, jammed };
    const hacker = this.players.find((p) => p.bot && p.role === ROLES.hacker);
    if (hacker) {
      hacker.botSeen ||= {};
      hacker.botSeen[q.seat] = team;
    }
  }

  _verify(p) {
    if (!["dawn", "day"].includes(this.phase) || !p.alive || p.role !== ROLES.signal) return { err: "no-action" };
    if (this.signalReport) return { err: "spent" };
    if (!this.lastScanAudit) return { err: "no-scan" };
    this.signalReport = { ...this.lastScanAudit };
    this._changed();
    return { ok: true };
  }

  _dispatch(p, target, text) {
    if (this.phase !== "day" || !p.alive || p.role !== ROLES.courier) return { err: "no-action" };
    if (this.dispatch) return { err: "spent" };
    const recipient = this._target(target);
    if (!recipient || recipient === p || recipient.bot) return { err: "target" };
    const body = cleanText(text, CHAT_MAX);
    if (!body) return { err: "empty" };
    this.dispatch = { from: p.seat, to: recipient.seat, text: body };
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
    const open = ["lobby", "day", "vote", "verdict", "dawn", "end"].includes(this.phase);
    if (!open && !(this.phase === "night" && isMole(p))) return { err: this.phase === "night" ? "night" : "phase" };
    // xô token riêng của người gửi (không bao giờ đưa vào viewFor) — lỗi chỉ phụ thuộc chính người gửi
    p.chatTok = Math.min(CHAT_BURST, (p.chatTok ?? CHAT_BURST) + ((now - (p.chatAt ?? now)) / 1000) * CHAT_PER_SEC); p.chatAt = now;
    if (p.chatTok < 1) return { err: "chat-slow" };
    p.chatTok -= 1;
    const msg = { seat: p.seat, text: s, ts: now };
    if (this.phase === "night") { this.moleChat.push(msg); if (this.moleChat.length > CHAT_KEEP) this.moleChat.shift(); }
    else { this.chat.push(msg); if (this.chat.length > CHAT_KEEP) this.chat.shift(); }
    this._changed();
    return { ok: true };
  }

  // ---------- vòng ngày / đêm ----------
  _enter(phase, ms, then) {
    this.clock.clearTimeout(this.timer);
    this._clearBots();
    this.phase = phase;
    this.endsAt = ms ? this.clock.now() + ms : 0;
    if (then) then.call(this);
    this.timer = ms ? this.clock.setTimeout(() => this._next(), ms) : null;
    this._changed();
    this._botsFor(phase, ms);
  }

  _next() {
    this.timer = null;
    switch (this.phase) {
      case "reveal": return this._toNight();
      case "night": return this._toDawn();
      case "dawn": return this._afterLoss("day", this.t.day);
      case "day": this.votes = new Map(); return this._enter("vote", this.t.vote);
      case "vote": return this._enter("verdict", this.t.verdict, () => this._resolveVote());
      case "verdict": return this._afterLoss("night");
    }
  }

  _toNight() {
    this.round++;
    this.night = { moleVotes: new Map(), scan: null, shield: null, repair: false, jam: false };
    this.moleChat = [];
    this._enter("night", this.t.night);
  }

  _toDawn() {
    const n = this.night;
    // Bot Nội Gián đi theo lựa chọn của đồng bọn là người thật (nếu có) ⇒ người chơi Nội Gián điều khiển được mục tiêu.
    const humanPick = [...n.moleVotes].find(([s]) => !this.players[s].bot && this.players[s].alive)?.[1];
    if (humanPick !== undefined) for (const [s] of n.moleVotes) if (this.players[s].bot) n.moleVotes.set(s, humanPick);
    // Ám hại: theo số phiếu đông nhất của các Nội Gián còn trong ván; hoà ⇒ chọn ngẫu nhiên trong nhóm hoà
    const tally = new Map();
    for (const [w, t] of n.moleVotes) if (this.players[w].alive && this.players[t]?.alive) tally.set(t, (tally.get(t) || 0) + 1);
    let victim = null;
    if (tally.size) {
      const max = Math.max(...tally.values()), top = [...tally].filter(([, c]) => c === max).map(([t]) => t);
      victim = top[this.randInt(top.length)];
    }
    this.lastShield = n.shield;
    if (this.players.length > MIN_PLAYERS && n.scan !== null) {
      this._recordScan(this.players[n.scan], n.jam);
      if (n.jam) this.jamUsed = true;
    }
    if (victim !== null && victim !== n.shield && n.repair) {
      this.repairUsed = true;
      victim = null;
    }
    if (victim !== null && victim !== n.shield) {
      const v = this.players[victim]; v.alive = false;
      this.events.push({ round: this.round, kind: "hit", seat: v.seat, role: v.role });
    } else this.events.push({ round: this.round, kind: "safe" });
    this.night = null;
    this._enter("dawn", this.t.dawn);
  }

  _resolveVote() {
    const tally = new Map();
    for (const [v, t] of this.votes) if (this.players[v].alive) tally.set(t, (tally.get(t) || 0) + 1);
    let jailed = null;
    if (tally.size) {
      const max = Math.max(...tally.values()), top = [...tally].filter(([, c]) => c === max);
      if (top.length === 1 && top[0][0] !== -1) jailed = top[0][0]; // hoà hoặc "bỏ qua" nhiều nhất ⇒ không bắt ai
    }
    if (jailed !== null) {
      const h = this.players[jailed]; h.alive = false;
      this.events.push({ round: this.round, kind: "jail", seat: h.seat, role: h.role });
    } else this.events.push({ round: this.round, kind: "nojail" });
  }

  _afterLoss(nextPhase, ms) {
    const w = this._winner();
    if (w) { this.winner = w; return this._enter("end", 0); }
    if (nextPhase === "night") return this._toNight();
    this._enter(nextPhase, ms);
  }

  _winner() {
    const alive = this.players.filter((p) => p.alive);
    const moles = alive.filter(isMole).length;
    if (moles === 0) return "agency";
    if (moles >= alive.length - moles) return "mole";
    return null;
  }

  // ---------- bot: hành động qua đúng các hàm của người thật ----------
  _clearBots() { for (const t of this.botTimers) this.clock.clearTimeout(t); this.botTimers = []; }
  _later(ms, f) { const t = this.clock.setTimeout(() => { this.botTimers = this.botTimers.filter((x) => x !== t); if (!this.closed) f(); }, ms); this.botTimers.push(t); }
  _pick(list) { return list.length ? list[this.randInt(list.length)] : null; }
  _botsFor(phase, ms) {
    const bots = this.players.filter((p) => p.bot && p.alive);
    if (!bots.length || !ms) return;
    const others = (b, f = () => true) => this.players.filter((q) => q.alive && q !== b && f(q));
    if (phase === "night") {
      for (const b of bots) this._later(Math.round(ms * (0.15 + this.randInt(40) / 100)), () => {
        if (this.phase !== "night" || !b.alive) return;
        let q = null;
        if (isMole(b)) {
          if (b.role === ROLES.jammer && !this.jamUsed && this.randInt(3) === 0) this._arm(b, ROLES.jammer, "jam", false, true);
          const mate = [...this.night.moleVotes].find(([s]) => s !== b.seat)?.[1];
          q = mate !== undefined ? this.players[mate] : this._pick(others(b, (x) => !isMole(x)));
        } else if (b.role === ROLES.hacker) q = this._pick(others(b, (x) => !(b.botSeen || {})[x.seat]));
        else if (b.role === ROLES.security) q = this._pick(this.players.filter((x) => x.alive && x.seat !== this.lastShield));
        else if (b.role === ROLES.technician && !this.repairUsed && this.randInt(3) === 0) return this._arm(b, ROLES.technician, "repair", false, true);
        else return;
        if (!q) return;
        this._act(b, q.seat);
      });
    } else if (phase === "day") {
      for (const b of bots) {
        if (b.role !== ROLES.signal && b.role !== ROLES.courier && !this.randInt(2)) continue;
        this._later(Math.round(ms * (0.1 + this.randInt(60) / 100)), () => {
          if (this.phase !== "day" || !b.alive) return;
          if (b.role === ROLES.signal && !this.signalReport && this.lastScanAudit) return this._verify(b);
          if (b.role === ROLES.courier && !this.dispatch) {
            const recipient = this._pick(others(b, (p) => !p.bot));
            if (recipient) return this._dispatch(b, recipient.seat, "Tôi là Liên Lạc Viên. Hãy để ý phiếu bầu.");
          }
          this._chat(b, QUICK[this.randInt(QUICK.length)]);
        });
      }
    } else if (phase === "vote") {
      for (const b of bots) this._later(Math.round(ms * (0.25 + this.randInt(45) / 100)), () => {
        if (this.phase !== "vote" || !b.alive) return;
        let q;
        if (isMole(b)) q = this._pick(others(b, (x) => !isMole(x)));
        else {
          const known = b.role === ROLES.hacker && b.botSeen ? others(b, (x) => b.botSeen[x.seat] === "mole") : [];
          q = known.length ? known[0] : this.randInt(5) === 0 ? null : this._pick(others(b));
        }
        this._vote(b, q ? q.seat : null);
      });
    }
  }

  close() { this.closed = true; this.clock.clearTimeout(this.timer); this.timer = null; this._clearBots(); }
  _changed() { this.onChange(); }

  // ---------- GÓC NHÌN: đường duy nhất dữ liệu đi ra khỏi server ----------
  viewFor(seat) {
    const me = this.players[seat];
    if (!me) return null;
    const over = this.phase === "end";
    const iAmMole = isMole(me);
    const players = this.players.map((p) => {
      const o = { seat: p.seat, name: p.name, avatar: p.avatar, alive: p.alive, connected: p.connected, bot: p.bot };
      // ai được thấy vai: chính mình | hết ván | người đã bị loại (lộ khi bị loại) | Nội Gián thấy Nội Gián
      if (p.role && (p === me || over || !p.alive || (iAmMole && isMole(p)))) o.role = p.role;
      return o;
    });
    const v = {
      code: this.code, seat, host: this.host, phase: this.phase, round: this.round,
      endsAt: this.endsAt, min: MIN_PLAYERS, max: MAX_PLAYERS, quick: QUICK,
      players, events: this.events.map((e) => ({ ...e })), chat: this.chat.map((c) => ({ ...c })),
    };
    if (this.lineup) v.lineup = { ...this.lineup };
    if (me.role === ROLES.signal) v.signal = { ready: !!this.lastScanAudit && !this.signalReport, report: this.signalReport && { ...this.signalReport } };
    if (this.dispatch && (this.dispatch.from === seat || this.dispatch.to === seat)) v.dispatch = { ...this.dispatch };
    if (this.phase === "night" && me.alive && this.night) {
      const n = this.night;
      if (iAmMole) v.night = { can: "sabotage", mine: n.moleVotes.get(seat) ?? null, pack: Object.fromEntries(n.moleVotes) };
      else if (me.role === ROLES.hacker) v.night = { can: "scan", mine: n.scan };
      else if (me.role === ROLES.security) v.night = { can: "shield", mine: n.shield, banned: this.lastShield };
      else if (me.role === ROLES.technician) v.night = { can: "repair", ready: !this.repairUsed, armed: n.repair };
      else v.night = { can: null };
      if (me.role === ROLES.jammer) v.night.jam = { ready: !this.jamUsed, armed: n.jam };
    }
    if (iAmMole && (this.phase === "night" || over)) v.moleChat = this.moleChat.map((c) => ({ ...c }));
    if (me.role === ROLES.hacker) v.scan = this.scanLog.map((r) => ({ ...r }));
    if (this.phase === "vote" || this.phase === "verdict") v.votes = Object.fromEntries(this.votes); // phiếu bắt giữ là công khai
    if (over) v.winner = this.winner;
    return v;
  }
}

module.exports = { Room, ROLES, TEAM, MIN_PLAYERS, MAX_PLAYERS, DEFAULT_TIMINGS, QUICK, BOT_NAMES, roleSet, cleanText };
