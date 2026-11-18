// Máy chủ phòng Nối Từ online 1v1: gắn WebSocket vào http.Server có sẵn.
// Trọng tài = session/referee.js của game, chạy NGUYÊN VĂN trên server (cùng file với bản chơi với máy) ⇒
// lượt đi, từ hợp lệ, đồng hồ 15 giây, thắng/thua đều do server quyết; client chỉ gửi ý định (intent).
// Danh tính = token ngẫu nhiên 128 bit do server cấp; một kết nối chỉ hành động được cho ĐÚNG ghế của token đó.
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { attachWs } = require("../ma-soi/ws");

const GAME_DIR = path.join(__dirname, "..", "..", "prototype", "games", "noi-tu");
const CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bỏ I, L, O, 0, 1 cho dễ đọc
const FORWARD = new Set(["join", "ping", "sync", "intent"]); // thông điệp chuyển cho trọng tài
const INTENTS = new Set(["submit", "resign", "rematch"]);

/** Tên hiển thị: bỏ ký tự điều khiển/định hướng/vô hình, gộp khoảng trắng, tối đa 16 ký tự. */
function cleanName(raw) {
  if (typeof raw !== "string") return "";
  const s = raw.normalize("NFC").replace(/[\p{C}\p{Zl}\p{Zp}]/gu, "").replace(/\s+/g, " ").trim();
  return [...s].slice(0, 16).join("");
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
  const ipOf = (req) => (trustProxy && String(req.headers["x-forwarded-for"] || "").split(",").map((x) => x.trim()).filter(Boolean).pop()) || req.socket.remoteAddress || "?";
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

  function bindRef(e, conn) { e.ref.connect(conn.id, (msg) => conn.ws.send(JSON.stringify(msg))); }

  function startMatch(e) {
    const { RefereeHost, dict, sch } = mods;
    e.ref = new RefereeHost({
      matchId: `nt-${e.code}-${crypto.randomBytes(4).toString("hex")}`, dict, scheduler: sch,
      seats: e.seats.map((s, i) => ({ kind: "human", id: `p${i}`, name: s.name, token: s.token })),
      botLevel: "easy", seed: crypto.randomInt(2 ** 31), first: crypto.randomInt(2), graceMs: opts.graceMs ?? 30000,
    });
    for (const c of e.conns) if (c.token) bindRef(e, c);
    lobbyPush(e);
  }

  function enter(conn, e, token) {
    conn.entry = e; conn.token = token;
    e.conns.add(conn); clearTimeout(e.idleTimer);
    const seat = seatOf(e, token);
    clearTimeout(e.graceTimers[seat]); e.graceTimers[seat] = null;
    if (e.ref) bindRef(e, conn);
    reply(conn, { t: "room", code: e.code, token, seat, names: names(e), started: !!e.ref });
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
      if (m.t === "create") {
        const name = cleanName(m.name); if (!name) return reply(conn, { t: "err", code: "name" });
        if (rooms.size >= maxRooms || [...rooms.values()].filter((x) => x.ip === conn.ip).length >= perIp.rooms) return reply(conn, { t: "err", code: "busy" });
        const code = newCode(); if (!code) return reply(conn, { t: "err", code: "busy" });
        const e = { code, ip: conn.ip, seats: [{ token: crypto.randomBytes(16).toString("hex"), name }, null], conns: new Set(), ref: null, idleTimer: null, graceTimers: [null, null] };
        rooms.set(code, e);
        return enter(conn, e, e.seats[0].token);
      }
      const e = rooms.get(String(m.code || "").toUpperCase().trim().slice(0, 8));
      if (!e) return reply(conn, { t: "err", code: "no-room" });
      if (m.t === "resume") {
        const token = typeof m.token === "string" && /^[0-9a-f]{32}$/.test(m.token) ? m.token : "";
        if (!token || seatOf(e, token) < 0) return reply(conn, { t: "err", code: "no-seat" });
        // một ghế chỉ một kết nối: kết nối cũ (tab cũ) bị thay
        for (const c of [...e.conns]) if (c.token === token) {
          reply(c, { t: "replaced" }); e.ref?.disconnect(c.id); e.conns.delete(c); c.entry = null; c.token = null; c.ws.close(4000);
        }
        return enter(conn, e, token);
      }
      const name = cleanName(m.name); if (!name) return reply(conn, { t: "err", code: "name" });
      if (e.seats[1]) return reply(conn, { t: "err", code: "full" });
      if (name.toLowerCase() === e.seats[0].name.toLowerCase()) return reply(conn, { t: "err", code: "name-taken" });
      e.seats[1] = { token: crypto.randomBytes(16).toString("hex"), name };
      enter(conn, e, e.seats[1].token);
      startMatch(e);
      return;
    }

    const e = conn.entry;
    if (!e || !conn.token) return reply(conn, { t: "err", code: "no-room" });
    if (m.t === "leave") { leave(conn, e); return reply(conn, { t: "left" }); }
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
      e.seats[seat] = null; lobbyPush(e);
    }
    checkIdle(e);
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
  }, { maxBytes: 1024, allowOrigin: opts.allowOrigin });

  return { rooms, ready, close: () => { for (const e of [...rooms.values()]) dropRoom(e); for (const ws of [...sockets]) ws.close(1001); } };
}

module.exports = { createNoiTuHost, cleanName };
