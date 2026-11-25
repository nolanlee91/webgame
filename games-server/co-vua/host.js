// Máy chủ phòng Cờ Vua (1v1): gắn WebSocket vào http.Server có sẵn, quản lý mã phòng + phiên người chơi.
// Cùng khuôn với games-server/ma-soi/host.js nhưng là bản độc lập (không dùng chung file giữa các game).
// Danh tính = token ngẫu nhiên 128 bit do máy chủ cấp (không tin tên / số ghế client gửi lên).
"use strict";
const crypto = require("crypto");
const { clientIp } = require("../client-ip.js");
const path = require("path");
const { pathToFileURL } = require("url");
const { attachWs } = require("./ws");
const { Room, MAX_PLAYERS } = require("./room");
const { cleanSid, rememberSid, isBanned, kickFromRoom } = require("../kick");
const { listPublicRooms } = require("../public-rooms");

const CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bỏ I, L, O, 0, 1 cho dễ đọc
const realClock = { now: () => Date.now(), setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (t) => clearTimeout(t) };
const GAME_DIR = path.join(__dirname, "..", "..", "prototype", "games", "co-vua");

function createCoVuaHost(server, opts = {}) {
  const wsPath = opts.path || "/ws/co-vua";
  const clock = opts.clock || realClock;
  const maxRooms = opts.maxRooms || 200;
  const rooms = new Map();   // code → { room, conns:Set<conn>, idleTimer, ip }
  const sockets = new Set();
  const RATE = { burst: 12, perSec: 5 };
  const perIp = { conns: opts.maxConnsPerIp ?? 16, rooms: opts.maxRoomsPerIp ?? 3 };
  const trustProxy = opts.trustProxy ?? process.env.COVUA_TRUST_PROXY === "1";
  const ipConns = new Map();
  const ipOf = (req) => clientIp(req, trustProxy); // X-Forwarded-For cuối, hoặc CF-Connecting-IP khi hop đó là Cloudflare (client-ip.js)

  // logic.js + ai.js là ES module dùng chung với client → nạp bất đồng bộ một lần khi khởi động.
  let L = null, A = null;
  const load = (f) => import(pathToFileURL(path.join(GAME_DIR, f)).href);
  const ready = Promise.all([opts.logic ? opts.logic : load("logic.js"), opts.ai ? opts.ai : load("ai.js")]).then(([l, a]) => { L = l; A = a; });
  ready.catch((e) => console.error("[co-vua] không nạp được logic.js / ai.js:", e));

  const newCode = () => {
    for (let k = 0; k < 50; k++) {
      let c = ""; for (let i = 0; i < 5; i++) c += CODE_ABC[crypto.randomInt(CODE_ABC.length)];
      if (!rooms.has(c)) return c;
    }
    return null;
  };

  function makeRoom(ip, m) {
    if (rooms.size >= maxRooms) return null;
    if ([...rooms.values()].filter((e) => e.ip === ip).length >= perIp.rooms) return null;
    const code = newCode(); if (!code) return null;
    const entry = { conns: new Set(), idleTimer: null, ip };
    entry.room = new Room({ code, L, A, clock, timings: opts.timings, onChange: () => push(entry) });
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
      if (m.t === "create") { entry = makeRoom(conn.ip, m); if (!entry) return reply(conn, { t: "err", code: "busy" }); }
      else {
        entry = rooms.get(String(m.code || "").toUpperCase().trim());
        if (!entry) return reply(conn, { t: "err", code: "no-room" });
      }
      let token;
      const sid = cleanSid(m.sid); // mã phiên trình duyệt — chỉ để chặn người bị chủ phòng mời ra (games-server/kick.js)
      if (m.t === "resume") {
        token = typeof m.token === "string" && /^[0-9a-f]{32}$/.test(m.token) ? m.token : "";
        if (token && isBanned(entry, clock.now(), { token, sid })) return reply(conn, { t: "err", code: "banned" }); // bị mời ra ⇒ không resume
        if (!token || seatOf(entry, token) < 0) return reply(conn, { t: "err", code: "no-seat" });
        for (const c of entry.conns) if (c.token === token && c !== conn) { c.token = null; c.ws.send(JSON.stringify({ t: "replaced" })); c.ws.close(4000); }
      } else {
        if (m.t === "join" && isBanned(entry, clock.now(), { sid })) return reply(conn, { t: "err", code: "banned" });
        token = crypto.randomBytes(16).toString("hex");
        let r;
        try { r = entry.room.join(typeof m.name === "string" ? m.name : "", token, conn.ip); }
        catch (e) { if (m.t === "create") dropRoom(entry); throw e; } // không để phòng mồ côi khi lỗi bất ngờ
        if (r.err) { if (m.t === "create") dropRoom(entry); return reply(conn, { t: "err", code: r.err }); }
        if (m.t === "create") entry.public = m.public === undefined || m.public === true;
      }
      conn.entry = entry; conn.token = token; conn.last = null; rememberSid(entry, token, sid);
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
    if (m.t === "kick") { // chủ phòng "Mời ra" một người (phòng chờ / hết ván) — kiểm chủ phòng + chặn vào lại 10 phút ở kick.js
      const r = kickFromRoom(entry, i, m.target, clock.now(), { banMs: opts.kickBanMs, name: m.name });
      if (r.err) return reply(conn, { t: "err", code: r.err, req: m.t });
      for (const c of r.victims) reply(c, { t: "kicked", by: "host" });
      if (entry.room.closed) return dropRoom(entry);
      return push(entry);
    }
    if (m.t === "disband") { // chủ phòng hủy phòng (phòng chờ / ván đã xong): báo mọi người rồi đóng phòng
      const room = entry.room, host = room.hostSeat ?? room.host;
      if (i !== host) return reply(conn, { t: "err", code: "not-host", req: m.t });
      if (room.phase !== "lobby" && room.phase !== "over" && room.phase !== "end") return reply(conn, { t: "err", code: "phase", req: m.t });
      const all = [...entry.conns]; entry.conns.clear(); // giữ kết nối mở: người chơi về màn đầu, tạo / vào phòng khác ngay
      for (const c of all) { c.token = null; c.entry = null; reply(c, { t: "closed" }); }
      return dropRoom(entry);
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
    ws.on("message", (raw) => { try { onMessage(conn, raw); } catch (e) { console.error("[co-vua]", e); reply(conn, { t: "err", code: "server" }); } });
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

  return { rooms, publicList: () => listPublicRooms(rooms, MAX_PLAYERS), ready, close: () => { for (const e of [...rooms.values()]) dropRoom(e); for (const ws of [...sockets]) ws.close(1001); } };
}

module.exports = { createCoVuaHost };
