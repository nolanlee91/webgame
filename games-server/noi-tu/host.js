// Máy chủ phòng Nối Từ online 1v1: gắn WebSocket vào http.Server có sẵn.
// Trọng tài = session/referee.js của game, chạy NGUYÊN VĂN trên server (cùng file với bản chơi với máy) ⇒
// lượt đi, từ hợp lệ, đồng hồ 15 giây, thắng/thua đều do server quyết; client chỉ gửi ý định (intent).
// Danh tính = token ngẫu nhiên 128 bit do server cấp; một kết nối chỉ hành động được cho ĐÚNG ghế của token đó.
"use strict";
const crypto = require("crypto");
const { clientIp } = require("../client-ip.js");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { attachWs } = require("../ma-soi/ws");
const { DEFAULT_NAME, cleanLine, cleanPlayerName, maskChat } = require("../moderation"); // bộ lọc dùng chung (games-server/MODERATION.md)
const { KICK_BAN_MS, cleanSid, rememberSid, isBanned, addBan } = require("../kick"); // "Mời ra" + chặn vào lại 10 phút theo phiên

const GAME_DIR = path.join(__dirname, "..", "..", "prototype", "games", "noi-tu");
const CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bỏ I, L, O, 0, 1 cho dễ đọc
const FORWARD = new Set(["join", "ping", "sync", "intent"]); // thông điệp chuyển cho trọng tài
const INTENTS = new Set(["submit", "resign", "rematch"]);
// Chat trong phòng: đi qua máy chủ (lọc + giới hạn) rồi phát lại cho các ghế — 2 máy không bao giờ nói chuyện trực tiếp.
const CHAT = { max: 200, keep: 50, burst: 5, perSec: 1 }; // ≤200 ký tự/tin; mỗi ghế dồn tối đa 5 tin, hồi 1 tin/giây

/** Tin nhắn: bỏ ký tự điều khiển/định hướng/vô hình, gộp khoảng trắng, tối đa CHAT.max ký tự; từ tục ⇒ ***, link ⇒ [link]. */
function cleanChat(raw) {
  if (typeof raw !== "string") return "";
  return maskChat(cleanLine(raw, CHAT.max));
}

/** Tên hiển thị: bỏ ký tự điều khiển/định hướng/vô hình, gộp khoảng trắng, tối đa 16 ký tự thật.
 *  Rỗng ⇒ "" (báo lỗi "name"); dính từ tục / link ⇒ `fallback` (không bao giờ lưu / phát tên gốc). */
function cleanName(raw, fallback = DEFAULT_NAME) {
  if (typeof raw !== "string" || !cleanLine(raw, 16, { stripInvisible: true, stripAngles: true })) return "";
  return cleanPlayerName(raw, fallback);
}

/** Chỉ cho đi qua đúng hình dạng thông điệp trọng tài cần — mọi trường lạ bị bỏ. */
function sanitize(m, token) {
  if (m.t === "join") return { t: "join", token, pin: m.pin && typeof m.pin === "object" ? { dictHash: String(m.pin.dictHash).slice(0, 32), normVersion: m.pin.normVersion, rulesVersion: m.pin.rulesVersion } : null };
  if (m.t === "ping") return { t: "ping", id: Number.isSafeInteger(m.id) ? m.id : 0, t0: Number.isFinite(m.t0) ? m.t0 : 0 };
  if (m.t === "sync") return { t: "sync" };
  if (m.t === "intent") {
    if (typeof m.commandId !== "string" || !/^[\w-]{1,64}$/.test(m.commandId)) return null;
    if (!INTENTS.has(m.type) || typeof m.matchId !== "string" || (m.roundId != null && typeof m.roundId !== "string")) return null;
    const o = { t: "intent", commandId: m.commandId, type: m.type, matchId: m.matchId, roundId: m.roundId ?? null };
    if (m.type === "submit") {
      if (typeof m.word !== "string" || m.word.length > 40 || !Number.isSafeInteger(m.expectedSeq)) return null;
      o.word = m.word; o.expectedSeq = m.expectedSeq;
    }
    return o;
  }
  return null;
}

function createNoiTuHost(server, opts = {}) {
  const wsPath = opts.path || "/ws/noi-tu";
  const maxRooms = opts.maxRooms || 300;
  const RATE = { burst: 20, perSec: 6 };
  const perIp = { conns: opts.maxConnsPerIp ?? 16, rooms: opts.maxRoomsPerIp ?? 4 };
  const trustProxy = opts.trustProxy ?? (process.env.MASOI_TRUST_PROXY === "1" || process.env.TRUST_PROXY === "1");
  const ipOf = (req) => clientIp(req, trustProxy); // X-Forwarded-For cuối, hoặc CF-Connecting-IP khi hop đó là Cloudflare (client-ip.js)
  const ipConns = new Map();
  const rooms = new Map();   // code → { code, ip, seats:[{token,name}|null ×2], conns:Set, ref, idleTimer, graceTimers }
  const sockets = new Set();
  let connSeq = 0;

  // Nạp trọng tài + từ điển (ES module của game) một lần khi khởi động.
  const ready = (async () => {
    const imp = (f) => import(pathToFileURL(path.join(GAME_DIR, f)).href);
    const [{ RefereeHost }, { createDict }, { realScheduler }] = await Promise.all([imp("session/referee.js"), imp("core/dict.js"), imp("session/scheduler.js")]);
    const dict = createDict(JSON.parse(fs.readFileSync(path.join(GAME_DIR, "data", "words.json"), "utf8")));
    return { RefereeHost, dict, sch: opts.scheduler || realScheduler() };
  })();
  let mods = null;
  ready.then((m) => { mods = m; }, (e) => console.error("[noi-tu] không nạp được trọng tài", e));

  const newCode = () => {
    for (let k = 0; k < 50; k++) {
      let c = ""; for (let i = 0; i < 5; i++) c += CODE_ABC[crypto.randomInt(CODE_ABC.length)];
      if (!rooms.has(c)) return c;
    }
    return null;
  };
  const seatOf = (e, token) => e.seats.findIndex((s) => s && s.token === token);
  const names = (e) => e.seats.map((s) => (s ? s.name : null));
  const reply = (conn, o) => conn.ws.send(JSON.stringify(o));

  function lobbyPush(e) {
    for (const c of e.conns) if (c.token) reply(c, { t: "lobby", code: e.code, seat: seatOf(e, c.token), names: names(e), started: !!e.ref });
  }

  function dropRoom(e) {
    clearTimeout(e.idleTimer);
    for (const t of e.graceTimers) clearTimeout(t);
    e.ref?.dispose();
    rooms.delete(e.code);
    for (const c of e.conns) { c.entry = null; c.token = null; c.ws.close(1000); }
  }

  // Phòng không còn ai kết nối ⇒ xoá sau 5 phút (giữ cho người rớt mạng quay lại).
  function checkIdle(e) {
    clearTimeout(e.idleTimer);
    if ([...e.conns].some((c) => c.token)) return;
    e.idleTimer = setTimeout(() => dropRoom(e), opts.idleMs ?? 5 * 60 * 1000);
    e.idleTimer.unref?.();
  }

  // Chat: chỉ người đã có ghế trong phòng (token từ kết nối, không tin client). Xô token theo GHẾ (vào lại không hồi xô).
  function chat(conn, e, raw) {
    const seat = seatOf(e, conn.token);
    if (seat < 0) return reply(conn, { t: "err", code: "no-seat" });
    const text = cleanChat(raw);
    if (!text) return reply(conn, { t: "err", code: "chat-empty" });
    const now = Date.now(), b = e.chatRate[seat];
    b.tok = Math.min(CHAT.burst, b.tok + ((now - b.at) / 1000) * CHAT.perSec); b.at = now;
    if (b.tok < 1) return reply(conn, { t: "err", code: "chat-slow" });
    b.tok -= 1;
    const msg = { seat, name: e.seats[seat].name, text, ts: now };
    e.chat.push(msg); if (e.chat.length > CHAT.keep) e.chat.shift(); // chỉ giữ trong bộ nhớ của phòng, mất khi phòng đóng
    const out = JSON.stringify({ t: "chat", ...msg });
    for (const c of e.conns) if (c.token) c.ws.send(out);
  }

  function bindRef(e, conn) { e.ref.connect(conn.id, (msg) => conn.ws.send(JSON.stringify(msg))); }

  function startMatch(e) {
    const { RefereeHost, dict, sch } = mods;
    e.ref = new RefereeHost({
      matchId: `nt-${e.code}-${crypto.randomBytes(4).toString("hex")}`, dict, scheduler: sch,
      seats: e.seats.map((s, i) => ({ kind: "human", id: `p${i}`, name: s.name, token: s.token })),
      botLevel: "easy", seed: crypto.randomInt(2 ** 31), first: crypto.randomInt(2), graceMs: opts.graceMs ?? 30000,
    });
    for (const c of e.conns) if (c.token) bindRef(e, c);
    // ghế nào chưa join trong graceMs (vd. chủ phòng đã đóng tab trước khi khách vào) ⇒ bot thay, ván không kẹt
    e.ref.awaitJoin(0); e.ref.awaitJoin(1);
    lobbyPush(e);
  }

  function enter(conn, e, token, sid) {
    conn.entry = e; conn.token = token; rememberSid(e, token, sid);
    e.conns.add(conn); clearTimeout(e.idleTimer);
    const seat = seatOf(e, token);
    clearTimeout(e.graceTimers[seat]); e.graceTimers[seat] = null;
    if (e.ref) bindRef(e, conn);
    reply(conn, { t: "room", code: e.code, token, seat, names: names(e), started: !!e.ref });
    reply(conn, { t: "chatlog", items: e.chat });
  }

  function onMessage(conn, raw) {
    const now = Date.now();
    conn.bucket = Math.min(RATE.burst, conn.bucket + ((now - conn.at) / 1000) * RATE.perSec); conn.at = now;
    if (conn.bucket < 1) return reply(conn, { t: "err", code: "slow" });
    conn.bucket -= 1;
    let m; try { m = JSON.parse(raw); } catch { return reply(conn, { t: "err", code: "bad" }); }
    if (!m || typeof m !== "object" || Array.isArray(m) || typeof m.t !== "string") return reply(conn, { t: "err", code: "bad" });
    if (!mods) return reply(conn, { t: "err", code: "loading" });

    if (m.t === "create" || m.t === "enter" || m.t === "resume") {
      if (conn.entry) return reply(conn, { t: "err", code: "already" });
      const sid = cleanSid(m.sid); // mã phiên trình duyệt — chỉ để chặn người bị chủ phòng mời ra (games-server/kick.js)
      if (m.t === "create") {
        const name = cleanName(m.name); if (!name) return reply(conn, { t: "err", code: "name" });
        if (rooms.size >= maxRooms || [...rooms.values()].filter((x) => x.ip === conn.ip).length >= perIp.rooms) return reply(conn, { t: "err", code: "busy" });
        const code = newCode(); if (!code) return reply(conn, { t: "err", code: "busy" });
        const e = { code, ip: conn.ip, public: m.public === undefined || m.public === true, seats: [{ token: crypto.randomBytes(16).toString("hex"), name }, null], conns: new Set(), ref: null, idleTimer: null, graceTimers: [null, null],
          chat: [], chatRate: [0, 1].map(() => ({ tok: CHAT.burst, at: Date.now() })) };
        rooms.set(code, e);
        return enter(conn, e, e.seats[0].token, sid);
      }
      const e = rooms.get(String(m.code || "").toUpperCase().trim().slice(0, 8));
      if (!e) return reply(conn, { t: "err", code: "no-room" });
      if (m.t === "resume") {
        const token = typeof m.token === "string" && /^[0-9a-f]{32}$/.test(m.token) ? m.token : "";
        if (token && isBanned(e, Date.now(), { token, sid })) return reply(conn, { t: "err", code: "banned" }); // bị mời ra ⇒ không resume
        if (!token || seatOf(e, token) < 0) return reply(conn, { t: "err", code: "no-seat" });
        // một ghế chỉ một kết nối: kết nối cũ (tab cũ) bị thay
        for (const c of [...e.conns]) if (c.token === token) {
          reply(c, { t: "replaced" }); e.ref?.disconnect(c.id); e.conns.delete(c); c.entry = null; c.token = null; c.ws.close(4000);
        }
        return enter(conn, e, token, sid);
      }
      if (isBanned(e, Date.now(), { sid })) return reply(conn, { t: "err", code: "banned" });
      const name = cleanName(m.name, e.seats[0]?.name === DEFAULT_NAME ? DEFAULT_NAME + " 2" : DEFAULT_NAME); if (!name) return reply(conn, { t: "err", code: "name" });
      if (e.seats[1]) return reply(conn, { t: "err", code: "full" });
      if (name.toLowerCase() === e.seats[0].name.toLowerCase()) return reply(conn, { t: "err", code: "name-taken" });
      e.seats[1] = { token: crypto.randomBytes(16).toString("hex"), name };
      e.chatRate[1] = { tok: CHAT.burst, at: Date.now() };
      enter(conn, e, e.seats[1].token, sid);
      startMatch(e);
      return;
    }

    const e = conn.entry;
    if (!e || !conn.token) return reply(conn, { t: "err", code: "no-room" });
    if (m.t === "leave") { leave(conn, e); return reply(conn, { t: "left" }); }
    if (m.t === "chat") return chat(conn, e, m.text);
    if (m.t === "kick") return kick(conn, e, m.target, m.name);
    if (!FORWARD.has(m.t)) return reply(conn, { t: "err", code: "bad" });
    if (!e.ref) return reply(conn, { t: "err", code: "not-started" });
    const msg = sanitize(m, conn.token); // token luôn lấy từ kết nối, không tin token client tự gửi kèm
    if (!msg) {
      // intent sai hình dạng nhưng có commandId hợp lệ ⇒ trả kết quả từ chối để client ngừng gửi lại
      if (m.t === "intent" && typeof m.commandId === "string" && /^[\w-]{1,64}$/.test(m.commandId)) reply(conn, { t: "result", commandId: m.commandId, res: { ok: false, reason: "bad-command" } });
      return reply(conn, { t: "err", code: "bad", req: m.t });
    }
    e.ref.message(conn.id, msg);
  }

  function leave(conn, e) {
    const seat = seatOf(e, conn.token);
    e.ref?.disconnect(conn.id);
    e.conns.delete(conn); conn.entry = null; conn.token = null;
    if (!e.ref) {
      // phòng chờ: chủ phòng rời ⇒ đóng phòng; người thứ hai chưa thể có (vào là bắt đầu ngay)
      if (seat === 0) return dropRoom(e);
      e.seats[seat] = null; e.chatRate[seat] = { tok: CHAT.burst, at: Date.now() }; lobbyPush(e);
    }
    checkIdle(e);
  }

  // Chủ phòng (ghế 0) "Mời ra" người kia — chỉ khi chưa có ván hoặc ván vừa xong (giữa ván thì đổi kết quả).
  // Người bị mời ra không vào lại phòng này được trong 10 phút (theo token ghế + mã phiên, không theo IP).
  // Phòng trở về phòng chờ, chủ phòng chờ người mới (ván cũ của trọng tài bỏ đi).
  function kick(conn, e, target, name) {
    const seat = seatOf(e, conn.token);
    if (seat !== 0) return reply(conn, { t: "err", code: "not-host", req: "kick" });
    if (target !== 1 || !e.seats[1] || (typeof name === "string" && name !== e.seats[1].name)) return reply(conn, { t: "err", code: "target", req: "kick" });
    if (e.ref && !e.ref.state?.round?.over) return reply(conn, { t: "err", code: "phase", req: "kick" });
    const token = e.seats[1].token;
    addBan(e, Date.now(), opts.kickBanMs ?? KICK_BAN_MS, { token, sid: e.sids?.get(token) || "" });
    e.sids?.delete(token);
    for (const c of [...e.conns]) if (c.token === token) {
      e.ref?.disconnect(c.id); e.conns.delete(c); c.entry = null; c.token = null;
      reply(c, { t: "kicked", by: "host" });
    }
    clearTimeout(e.graceTimers[1]); e.graceTimers[1] = null;
    if (e.ref) { e.ref.dispose(); e.ref = null; }
    e.seats[1] = null; e.chatRate[1] = { tok: CHAT.burst, at: Date.now() };
    lobbyPush(e); // chủ phòng nhận {t:"lobby", started:false} ⇒ về màn chờ người mới
  }

  attachWs(server, wsPath, (ws, req) => {
    const ip = ipOf(req);
    if ((ipConns.get(ip) || 0) >= perIp.conns) { ws.send(JSON.stringify({ t: "err", code: "busy" })); return ws.close(1008); }
    ipConns.set(ip, (ipConns.get(ip) || 0) + 1);
    const conn = { id: `c${++connSeq}`, ws, ip, entry: null, token: null, bucket: RATE.burst, at: Date.now() };
    sockets.add(ws);
    ws.on("message", (raw) => { try { onMessage(conn, raw); } catch (err) { console.error("[noi-tu]", err); reply(conn, { t: "err", code: "server" }); } });
    ws.on("close", () => {
      sockets.delete(ws);
      const n = (ipConns.get(ip) || 1) - 1; if (n > 0) ipConns.set(ip, n); else ipConns.delete(ip);
      const e = conn.entry; if (!e) return;
      e.conns.delete(conn);
      if (e.ref) e.ref.disconnect(conn.id); // trọng tài tự chờ 30 s rồi cho máy thay ghế
      checkIdle(e);
    });
  }, { maxBytes: 1024, allowOrigin: opts.allowOrigin, pingMs: opts.pingMs, deadMs: opts.deadMs });

  function publicList() {
    return [...rooms.values()]
      .filter((e) => e.public && !e.ref && !e.seats[1] && [...e.conns].some((c) => c.ws.open && c.token === e.seats[0].token))
      .map((e) => ({ code: e.code, host: cleanPlayerName(e.seats[0].name), n: 1, max: 2 })); // lọc lại (phòng thủ 2 lớp)
  }

  return { rooms, publicList, ready, close: () => { for (const e of [...rooms.values()]) dropRoom(e); for (const ws of [...sockets]) ws.close(1001); } };
}

module.exports = { createNoiTuHost, cleanName };
