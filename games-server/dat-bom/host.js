// Máy chủ phòng Đặt Bom: gắn WebSocket vào http.Server có sẵn, quản lý mã phòng, phòng công khai, phiên người chơi.
// Cùng khuôn với games-server/co-ca-ngua/host.js nhưng là bản độc lập (không dùng chung file giữa các game).
// Danh tính = token ngẫu nhiên 128 bit do máy chủ cấp (không tin tên / số ghế client gửi lên).
"use strict";
const crypto = require("crypto");
const { clientIp } = require("../client-ip.js");
const path = require("path");
const { pathToFileURL } = require("url");
const { attachWs } = require("./ws");
const { Room, MAX_PLAYERS } = require("./room");
const { cleanSid, rememberSid, isBanned, kickFromRoom } = require("../kick");

const CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bỏ I, L, O, 0, 1 cho dễ đọc
const realClock = { now: () => Date.now(), setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (t) => clearTimeout(t) };
const LOGIC = path.join(__dirname, "..", "..", "prototype", "games", "dat-bom", "logic.js");
const cryptoRand = () => crypto.randomInt(0x7fffffff) / 0x7fffffff;

function createDatBomHost(server, opts = {}) {
  const wsPath = opts.path || "/ws/dat-bom";
  const clock = opts.clock || realClock;
  const rand = opts.rand || cryptoRand;
  const maxRooms = opts.maxRooms || 200;
  const rooms = new Map();   // code → { room, conns:Set<conn>, idleTimer, lobbyTimers, ip }
  const sockets = new Set();
  const RATE = { burst: 12, perSec: 5 };   // lệnh thường (tạo/vào phòng, bom, chat, danh sách…)
  const MOVE = { burst: 30, perSec: 30 };  // gói vị trí (client gửi ≤ 20 gói/giây)
  const perIp = { conns: opts.maxConnsPerIp ?? 16, rooms: opts.maxRoomsPerIp ?? 3 };
  const trustProxy = opts.trustProxy ?? process.env.DATBOM_TRUST_PROXY === "1";
  const ipConns = new Map();
  const ipOf = (req) => clientIp(req, trustProxy); // X-Forwarded-For cuối, hoặc CF-Connecting-IP khi hop đó là Cloudflare (client-ip.js)

  // logic.js là ES module dùng chung với client → nạp bất đồng bộ một lần khi khởi động.
  let L = null;
  const ready = (opts.logic ? Promise.resolve(opts.logic) : import(pathToFileURL(LOGIC).href)).then((m) => (L = m));
  let loadFailed = false; // nạp hỏng thì báo lỗi máy chủ, đừng để người chơi chờ "đang khởi động" mãi
  ready.catch((e) => { loadFailed = true; console.error("[dat-bom] không nạp được logic.js:", e); });

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
    const entry = { conns: new Set(), idleTimer: null, lobbyTimers: new Map(), ip };
    entry.room = new Room({ code, L, clock, rand, rules: opts.rules, tickMs: opts.tickMs,
      onChange: () => push(entry), onFrame: (f) => broadcast(entry, f) });
    rooms.set(code, entry);
    return entry;
  }

  function dropRoom(entry) {
    entry.room.close();
    clock.clearTimeout(entry.idleTimer);
    for (const t of entry.lobbyTimers.values()) clock.clearTimeout(t);
    entry.lobbyTimers.clear();
    rooms.delete(entry.room.code);
    for (const c of entry.conns) c.ws.close(1000);
  }

  // Phòng không còn ai kết nối ⇒ xoá sau 5 phút (giữ cho người rớt mạng quay lại).
  const hasPlayers = (entry) => [...entry.conns].some((c) => c.ws.open && seatOf(entry, c.token) >= 0);
  function checkIdle(entry) {
    clock.clearTimeout(entry.idleTimer);
    entry.idleTimer = null;
    if (entry.room.closed || rooms.get(entry.room.code) !== entry || hasPlayers(entry)) return;
    const timer = clock.setTimeout(() => {
      if (entry.idleTimer !== timer || rooms.get(entry.room.code) !== entry || hasPlayers(entry)) return;
      dropRoom(entry);
    }, opts.idleMs ?? 5 * 60 * 1000);
    entry.idleTimer = timer;
    entry.idleTimer.unref?.();
  }

  const seatOf = (entry, token) => (token ? entry.room.players.findIndex((p) => p.token === token) : -1);

  /** Gửi trạng thái phòng (phòng chờ, người chơi, chat, kết quả) cho từng kết nối — chỉ khi nội dung đổi. */
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

  /** Khung ván chơi (20 lần/giây) — giống nhau cho cả phòng. */
  function broadcast(entry, frame) {
    for (const c of entry.conns) if (c.token && c.ws.open) c.ws.send(frame);
  }

  /** Danh sách phòng công khai còn chỗ, đang ở phòng chờ. */
  function publicList(limit) {
    const out = [];
    for (const e of rooms.values()) {
      const r = e.room;
      if (!r.public || r.closed || r.phase !== "lobby" || r.players.length >= MAX_PLAYERS) continue;
      if (!r.players.some((p) => p.connected && !p.bot)) continue;
      out.push({ code: r.code, host: r.players[r.hostSeat]?.name || "", n: r.players.length, max: MAX_PLAYERS });
      if (out.length >= limit) break;
    }
    return out;
  }

  const take = (conn, key, R, now) => {
    conn[key] = Math.min(R.burst, conn[key] + ((now - conn[key + "At"]) / 1000) * R.perSec); conn[key + "At"] = now;
    if (conn[key] < 1) return false;
    conn[key] -= 1; return true;
  };

  function onMessage(conn, raw) {
    const now = clock.now();
    const isMove = typeof raw === "string" ? raw.startsWith('{"t":"mv"') : false;
    if (!take(conn, isMove ? "mb" : "bucket", isMove ? MOVE : RATE, now)) return isMove ? undefined : reply(conn, { t: "err", code: "slow" });
    let m; try { m = JSON.parse(raw); } catch { return reply(conn, { t: "err", code: "bad" }); }
    if (!m || typeof m !== "object" || Array.isArray(m)) return reply(conn, { t: "err", code: "bad" });
    if (m.t === "mv" && !isMove) return reply(conn, { t: "err", code: "bad" }); // gói vị trí phải đi đúng khuôn (để tính hạn mức riêng)
    if (m.t === "ping") return reply(conn, { t: "pong", now: clock.now() });
    if (!L) return reply(conn, { t: "err", code: loadFailed ? "server" : "loading" });
    if (m.t === "list") return reply(conn, { t: "list", rooms: publicList(20) });

    if (m.t === "create" || m.t === "join" || m.t === "resume") {
      if (conn.entry) return reply(conn, { t: "err", code: "already" });
      let entry;
      if (m.t === "create") { entry = makeRoom(conn.ip); if (!entry) return reply(conn, { t: "err", code: "busy" }); }
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
        const r = entry.room.join(m.name, token, conn.ip);
        if (r.err) { if (m.t === "create") dropRoom(entry); return reply(conn, { t: "err", code: r.err }); }
        if (m.t === "create") entry.room.public = m.public === undefined || m.public === true;
      }
      conn.entry = entry; conn.token = token; conn.last = null; rememberSid(entry, token, sid);
      entry.conns.add(conn); clock.clearTimeout(entry.idleTimer); entry.idleTimer = null;
      clock.clearTimeout(entry.lobbyTimers.get(token)); entry.lobbyTimers.delete(token);
      reply(conn, { t: "joined", code: entry.room.code, token });
      entry.room.setConnected(seatOf(entry, token), true);
      push(entry);
      if (entry.room.phase !== "lobby" && entry.room.g) reply(conn, null, entry.room.frame()); // vào lại giữa ván: có ngay khung hiện tại
      return;
    }
    const entry = conn.entry;
    if (!entry || !conn.token) return reply(conn, { t: "err", code: "no-room" });
    const i = seatOf(entry, conn.token);
    if (i < 0) return reply(conn, { t: "err", code: "no-seat" });
    if (m.t === "sync") { conn.last = null; return push(entry); }
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
    if (r?.fix) reply(conn, { t: "fix", ...r.fix });
    else if (r?.err) reply(conn, { t: "err", code: r.err, req: m.t });
  }

  function reply(conn, o, rawStr) { if (conn.ws.open) conn.ws.send(rawStr || JSON.stringify(o)); }

  attachWs(server, wsPath, (ws, req) => {
    const ip = ipOf(req);
    if ((ipConns.get(ip) || 0) >= perIp.conns) { ws.send(JSON.stringify({ t: "err", code: "busy" })); return ws.close(1008); }
    ipConns.set(ip, (ipConns.get(ip) || 0) + 1);
    const now = clock.now();
    const conn = { ws, ip, entry: null, token: null, last: null, bucket: RATE.burst, bucketAt: now, mb: MOVE.burst, mbAt: now };
    sockets.add(ws);
    ws.on("message", (raw) => { try { onMessage(conn, raw); } catch (e) { console.error("[dat-bom]", e); reply(conn, { t: "err", code: "server" }); } });
    ws.on("close", () => {
      sockets.delete(ws);
      const n = (ipConns.get(ip) || 1) - 1; if (n > 0) ipConns.set(ip, n); else ipConns.delete(ip);
      const entry = conn.entry; if (!entry) return;
      entry.conns.delete(conn);
      if (conn.token) {
        const token = conn.token, i = seatOf(entry, token);
        if (i >= 0) entry.room.setConnected(i, false);
        // phòng chờ: rời hẳn sau 20 s nếu không quay lại; đang chơi: giữ ghế (nhân vật đứng yên, vẫn có thể trúng bom)
        if (entry.room.phase === "lobby") {
          clock.clearTimeout(entry.lobbyTimers.get(token));
          const t = clock.setTimeout(() => {
            if (entry.lobbyTimers.get(token) !== t || rooms.get(entry.room.code) !== entry) return;
            entry.lobbyTimers.delete(token);
            const s = seatOf(entry, token);
            if (s >= 0 && !entry.room.players[s].connected && entry.room.phase === "lobby") { entry.room.leave(s); if (entry.room.closed) dropRoom(entry); }
          }, (opts.lobbyGraceMs ?? 20000) + (ws.silent ? (opts.silentExtraMs ?? 45000) : 0)); // rớt im lặng (nhịp tim 15 s) ⇒ giữ thêm 45 s: tổng ≈ 80 s như trước D8
          entry.lobbyTimers.set(token, t); t.unref?.();
        }
      }
      checkIdle(entry);
    });
  }, { maxBytes: 1024, allowOrigin: opts.allowOrigin, pingMs: opts.pingMs, deadMs: opts.deadMs });

  return { rooms, publicList: () => publicList(Infinity), ready, close: () => { for (const e of [...rooms.values()]) dropRoom(e); for (const ws of [...sockets]) ws.close(1001); } };
}

module.exports = { createDatBomHost };
