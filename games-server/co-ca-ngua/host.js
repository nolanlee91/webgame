// Máy chủ phòng Cờ Cá Ngựa: gắn WebSocket vào http.Server có sẵn, quản lý mã phòng + phiên người chơi.
// Cùng khuôn với games-server/ma-soi/host.js nhưng là bản độc lập (không dùng chung file giữa các game).
// Danh tính = token ngẫu nhiên 128 bit do máy chủ cấp (không tin tên / số ghế client gửi lên).
"use strict";
const crypto = require("crypto");
const path = require("path");
const { pathToFileURL } = require("url");
const { attachWs } = require("./ws");
const { Room } = require("./room");

const CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bỏ I, L, O, 0, 1 cho dễ đọc
const realClock = { now: () => Date.now(), setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (t) => clearTimeout(t) };
const LOGIC = path.join(__dirname, "..", "..", "prototype", "games", "co-ca-ngua", "logic.js");

function createCoCaNguaHost(server, opts = {}) {
  const wsPath = opts.path || "/ws/co-ca-ngua";
  const clock = opts.clock || realClock;
  const randInt = opts.randInt || ((n) => crypto.randomInt(n));
  const maxRooms = opts.maxRooms || 200;
  const rooms = new Map();   // code → { room, conns:Set<conn>, idleTimer, ip }
  const sockets = new Set();
  const RATE = { burst: 12, perSec: 5 };
  const perIp = { conns: opts.maxConnsPerIp ?? 16, rooms: opts.maxRoomsPerIp ?? 3 };
  const trustProxy = opts.trustProxy ?? process.env.COCANGUA_TRUST_PROXY === "1";
  const ipConns = new Map();
  const ipOf = (req) => (trustProxy && String(req.headers["x-forwarded-for"] || "").split(",").map((x) => x.trim()).filter(Boolean).pop()) || req.socket.remoteAddress || "?";

  // logic.js là ES module dùng chung với client → nạp bất đồng bộ một lần khi khởi động.
  let L = null;
  const ready = (opts.logic ? Promise.resolve(opts.logic) : import(pathToFileURL(LOGIC).href)).then((m) => (L = m));
  ready.catch((e) => console.error("[co-ca-ngua] không nạp được logic.js:", e));

  const newCode = () => {
    for (let k = 0; k < 50; k++) {
      let c = ""; for (let i = 0; i < 5; i++) c += CODE_ABC[crypto.randomInt(CODE_ABC.length)];
      if (!rooms.has(c)) return c;
    }
    return null;
  };

  function makeRoom(ip) {
    if (rooms.size >= maxRooms) return null;
    if ([...rooms.values()].filter((e) => e.ip === ip).length >= perIp.rooms) return null;
    const code = newCode(); if (!code) return null;
    const entry = { conns: new Set(), idleTimer: null, ip };
    entry.room = new Room({ code, L, clock, randInt, timings: opts.timings, onChange: () => push(entry) });
    rooms.set(code, entry);
    return entry;
  }

  function dropRoom(entry) {
    entry.room.close();
    clearTimeout(entry.idleTimer);
    rooms.delete(entry.room.code);
    for (const c of entry.conns) c.ws.close(1000);
  }

  // Phòng không còn ai kết nối ⇒ xoá sau 5 phút (giữ cho người rớt mạng quay lại).
  function checkIdle(entry) {
    clearTimeout(entry.idleTimer);
    if ([...entry.conns].some((c) => c.token)) return;
    entry.idleTimer = setTimeout(() => dropRoom(entry), opts.idleMs ?? 5 * 60 * 1000);
    entry.idleTimer.unref?.();
  }

  const seatOf = (entry, token) => (token ? entry.room.players.findIndex((p) => p.token === token) : -1);

  /** Gửi trạng thái mới cho từng kết nối — chỉ khi nội dung đổi. */
  function push(entry) {
    for (const c of entry.conns) {
      if (!c.token) continue;
      const i = seatOf(entry, c.token);
      if (i < 0) { c.ws.send(JSON.stringify({ t: "kicked" })); c.token = null; continue; }
      const v = JSON.stringify(entry.room.viewFor(i));
      if (v === c.last) continue;
      c.last = v;
      c.ws.send(`{"t":"state","now":${clock.now()},"v":${v}}`);
    }
  }

  function onMessage(conn, raw) {
    const now = clock.now();
    conn.bucket = Math.min(RATE.burst, conn.bucket + ((now - conn.at) / 1000) * RATE.perSec); conn.at = now;
    if (conn.bucket < 1) return reply(conn, { t: "err", code: "slow" });
    conn.bucket -= 1;
    let m; try { m = JSON.parse(raw); } catch { return reply(conn, { t: "err", code: "bad" }); }
    if (!m || typeof m !== "object" || Array.isArray(m)) return reply(conn, { t: "err", code: "bad" });
    if (m.t === "ping") return reply(conn, { t: "pong", now: clock.now() });
    if (!L) return reply(conn, { t: "err", code: "loading" });

    if (m.t === "create" || m.t === "join" || m.t === "resume") {
      if (conn.entry) return reply(conn, { t: "err", code: "already" });
      let entry;
      if (m.t === "create") { entry = makeRoom(conn.ip); if (!entry) return reply(conn, { t: "err", code: "busy" }); }
      else {
        entry = rooms.get(String(m.code || "").toUpperCase().trim());
        if (!entry) return reply(conn, { t: "err", code: "no-room" });
      }
      let token;
      if (m.t === "resume") {
        token = typeof m.token === "string" && /^[0-9a-f]{32}$/.test(m.token) ? m.token : "";
        if (!token || seatOf(entry, token) < 0) return reply(conn, { t: "err", code: "no-seat" });
        for (const c of entry.conns) if (c.token === token && c !== conn) { c.token = null; c.ws.send(JSON.stringify({ t: "replaced" })); c.ws.close(4000); }
      } else {
        token = crypto.randomBytes(16).toString("hex");
        const r = entry.room.join(m.name, token);
        if (r.err) { if (m.t === "create") dropRoom(entry); return reply(conn, { t: "err", code: r.err }); }
      }
      conn.entry = entry; conn.token = token; conn.last = null;
      entry.conns.add(conn); clearTimeout(entry.idleTimer);
      reply(conn, { t: "joined", code: entry.room.code, token });
      entry.room.setConnected(seatOf(entry, token), true);
      push(entry);
      return;
    }
    const entry = conn.entry;
    if (!entry || !conn.token) return reply(conn, { t: "err", code: "no-room" });
    const i = seatOf(entry, conn.token);
    if (i < 0) return reply(conn, { t: "err", code: "no-seat" });
    if (m.t === "sync") { conn.last = null; return push(entry); } // client thấy lệch → gửi lại toàn bộ trạng thái
    if (m.t === "leave") {
      conn.token = null; entry.conns.delete(conn); conn.entry = null;
      entry.room.leave(i);
      if (entry.room.closed) dropRoom(entry); else checkIdle(entry);
      return reply(conn, { t: "left" });
    }
    const r = entry.room.handle(i, m);
    if (r?.err) reply(conn, { t: "err", code: r.err, req: m.t });
  }

  function reply(conn, o) { conn.ws.send(JSON.stringify(o)); }

  attachWs(server, wsPath, (ws, req) => {
    const ip = ipOf(req);
    if ((ipConns.get(ip) || 0) >= perIp.conns) { ws.send(JSON.stringify({ t: "err", code: "busy" })); return ws.close(1008); }
    ipConns.set(ip, (ipConns.get(ip) || 0) + 1);
    const conn = { ws, ip, entry: null, token: null, last: null, bucket: RATE.burst, at: clock.now() };
    sockets.add(ws);
    ws.on("message", (raw) => { try { onMessage(conn, raw); } catch (e) { console.error("[co-ca-ngua]", e); reply(conn, { t: "err", code: "server" }); } });
    ws.on("close", () => {
      sockets.delete(ws);
      const n = (ipConns.get(ip) || 1) - 1; if (n > 0) ipConns.set(ip, n); else ipConns.delete(ip);
      const entry = conn.entry; if (!entry) return;
      entry.conns.delete(conn);
      if (conn.token) {
        const token = conn.token, i = seatOf(entry, token);
        if (i >= 0) entry.room.setConnected(i, false);
        // phòng chờ: rời hẳn sau 20 s nếu không quay lại; đang chơi: giữ ghế (máy chủ đi thay khi tới lượt)
        if (entry.room.phase === "lobby") {
          const t = setTimeout(() => {
            const s = seatOf(entry, token);
            if (s >= 0 && !entry.room.players[s].connected && entry.room.phase === "lobby") { entry.room.leave(s); if (entry.room.closed) dropRoom(entry); }
          }, opts.lobbyGraceMs ?? 20000); t.unref?.();
        }
      }
      checkIdle(entry);
    });
  }, { maxBytes: 1024, allowOrigin: opts.allowOrigin });

  return { rooms, ready, close: () => { for (const e of [...rooms.values()]) dropRoom(e); for (const ws of [...sockets]) ws.close(1001); } };
}

module.exports = { createCoCaNguaHost };
