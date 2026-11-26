// Máy chủ phòng Ai Là Nội Gián (chép từ games-server/ma-soi/host.js, đã qua review Codex): gắn WebSocket vào http.Server có sẵn, quản lý mã phòng + phiên người chơi.
// Danh tính = token ngẫu nhiên 128 bit do server cấp (không tin tên / số ghế client gửi lên).
// Mỗi kết nối chỉ nhận góc nhìn của CHÍNH ghế mình (room.viewFor), và chỉ khi góc nhìn đó đổi.
"use strict";
const crypto = require("crypto");
const { clientIp } = require("../client-ip.js");
const { attachWs } = require("../ma-soi/ws"); // dùng chung bản WebSocket tối giản của Ma Sói (không sửa)
const { Room, MAX_PLAYERS } = require("./room");
const { cleanSid, rememberSid, isBanned, kickFromRoom } = require("../kick");
const { listPublicRooms } = require("../public-rooms");

const CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bỏ I, L, O, 0, 1 cho dễ đọc
const realClock = { now: () => Date.now(), setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (t) => clearTimeout(t) };
const randInt = (n) => crypto.randomInt(n);

function createNoiGianHost(server, opts = {}) {
  const path = opts.path || "/ws/ai-la-noi-gian";
  const timings = opts.timings;
  const clock = opts.clock || realClock;
  const maxRooms = opts.maxRooms || 200;
  const rooms = new Map();           // code → { room, conns:Set<conn> }
  const sockets = new Set();         // mọi kết nối đang mở (để tắt máy chủ gọn)
  const RATE = { burst: 12, perSec: 4 };
  // Chưa có tài khoản ⇒ hạn mức theo địa chỉ IP để một máy không chiếm hết phòng / kết nối của máy chủ.
  // Sau proxy (Railway) chỉ tin X-Forwarded-For khi NOIGIAN_TRUST_PROXY=1 (hoặc MASOI_TRUST_PROXY=1 như Ma Sói).
  const perIp = { conns: opts.maxConnsPerIp ?? 16, rooms: opts.maxRoomsPerIp ?? 3 };
  const trustProxy = opts.trustProxy ?? (process.env.NOIGIAN_TRUST_PROXY === "1" || process.env.MASOI_TRUST_PROXY === "1");
  const ipConns = new Map();
  // Lấy phần tử CUỐI của X-Forwarded-For (do proxy gần nhất ghi, client không giả được); phần đầu do client tự đặt.
  const ipOf = (req) => clientIp(req, trustProxy); // X-Forwarded-For cuối, hoặc CF-Connecting-IP khi hop đó là Cloudflare (client-ip.js)

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
    const entry = { conns: new Set(), idleTimer: null, ip, graceTimers: new Map() }; // graceTimers: token → hẹn giờ rời phòng chờ
    entry.room = new Room({ code, timings, clock, randInt, onChange: () => push(entry) });
    rooms.set(code, entry);
    return entry;
  }

  function dropRoom(entry) {
    entry.room.close();
    clearTimeout(entry.idleTimer);
    for (const t of entry.graceTimers.values()) clearTimeout(t);
    entry.graceTimers.clear();
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

  const seatOf = (entry, token) => entry.room.players.findIndex((p) => p.token === token);

  // PARTY2-03 (D8): vừa hết ván ⇒ hỏi thăm kết nối của chủ phòng (ping). Không có gì về trong endProbeMs (tab đã đóng mà máy
  // chủ chưa nhận khung đóng, điện thoại khoá màn…) ⇒ coi như rớt: đóng kết nối đó (silent), room.setConnected chuyển chủ phòng
  // cho người kế tiếp ngay, không phải chờ nhịp tim 15 s. Chủ phòng thật ra vẫn còn ⇒ trình duyệt tự nối lại + resume, giữ ghế.
  function probeHostAtEnd(entry) {
    const room = entry.room, hostP = room.players[room.host];
    if (!hostP || hostP.bot || !hostP.connected) return;
    const c = [...entry.conns].find((x) => x.token === hostP.token);
    if (!c || !c.ws.open || typeof c.ws.ping !== "function") return;
    const t0 = Date.now();
    c.ws.ping();
    const t = setTimeout(() => {
      if (entry.room.phase !== "end" || !c.ws.open || c.token !== hostP.token) return;
      if ((c.ws.rxAt || 0) < t0) { c.ws.silent = true; c.ws.close(1001); }
    }, opts.endProbeMs ?? 4000);
    t.unref?.();
  }

  /** Gửi góc nhìn mới cho từng kết nối — CHỈ khi nội dung góc nhìn của ghế đó thay đổi. */
  function push(entry) {
    if (entry.room.phase !== entry.lastPhase) { entry.lastPhase = entry.room.phase; if (entry.lastPhase === "end") probeHostAtEnd(entry); }
    for (const c of entry.conns) {
      if (!c.token) continue;
      const seat = seatOf(entry, c.token);
      if (seat < 0) { c.ws.send(JSON.stringify({ t: "kicked" })); c.token = null; continue; }
      const v = JSON.stringify(entry.room.viewFor(seat));
      if (v === c.last) continue;
      c.last = v;
      c.ws.send(`{"t":"state","now":${clock.now()},"v":${v}}`);
    }
  }

  function onMessage(conn, raw) {
    // giới hạn tốc độ: xô token, 12 lệnh dồn, hồi 4 lệnh/giây
    const now = clock.now();
    conn.bucket = Math.min(RATE.burst, conn.bucket + ((now - conn.at) / 1000) * RATE.perSec); conn.at = now;
    if (conn.bucket < 1) return reply(conn, { t: "err", code: "slow" });
    conn.bucket -= 1;
    let m; try { m = JSON.parse(raw); } catch { return reply(conn, { t: "err", code: "bad" }); }
    if (!m || typeof m !== "object" || Array.isArray(m)) return reply(conn, { t: "err", code: "bad" });

    if (m.t === "ping") return reply(conn, { t: "pong", now: clock.now() });
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
        // một ghế chỉ một kết nối: kết nối cũ (tab cũ) bị thay
        for (const c of entry.conns) if (c.token === token && c !== conn) { c.token = null; c.ws.send(JSON.stringify({ t: "replaced" })); c.ws.close(4000); }
      } else {
        if (m.t === "join" && isBanned(entry, clock.now(), { sid })) return reply(conn, { t: "err", code: "banned" });
        token = crypto.randomBytes(16).toString("hex");
        const r = entry.room.join(m.name, token);
        if (r.err) { if (m.t === "create") dropRoom(entry); return reply(conn, { t: "err", code: r.err }); }
        if (m.t === "create") entry.public = m.public === undefined || m.public === true;
      }
      cancelGrace(entry, token); // quay lại kịp ⇒ huỷ hẹn giờ rời phòng của lần rớt mạng trước
      conn.entry = entry; conn.token = token; conn.last = null; rememberSid(entry, token, sid);
      entry.conns.add(conn); clearTimeout(entry.idleTimer);
      reply(conn, { t: "joined", code: entry.room.code, token });
      entry.room.setConnected(seatOf(entry, token), true);
      push(entry);
      return;
    }
    const entry = conn.entry;
    if (!entry || !conn.token) return reply(conn, { t: "err", code: "no-room" });
    const seat = seatOf(entry, conn.token);
    if (seat < 0) return reply(conn, { t: "err", code: "no-seat" });
    if (m.t === "leave") {
      entry.room.leave(seat);
      conn.token = null; entry.conns.delete(conn); conn.entry = null;
      if (entry.room.closed) dropRoom(entry); else checkIdle(entry);
      return reply(conn, { t: "left" });
    }
    if (m.t === "kick") { // chủ phòng "Mời ra" một người (phòng chờ / hết ván) — kiểm chủ phòng + chặn vào lại 10 phút ở kick.js
      const r = kickFromRoom(entry, seat, m.target, clock.now(), { banMs: opts.kickBanMs, name: m.name });
      if (r.err) return reply(conn, { t: "err", code: r.err, req: m.t });
      for (const c of r.victims) reply(c, { t: "kicked", by: "host" });
      if (entry.room.closed) return dropRoom(entry);
      return push(entry);
    }
    if (m.t === "disband") { // chủ phòng hủy phòng (phòng chờ / ván đã xong): báo mọi người rồi đóng phòng
      const room = entry.room, host = room.hostSeat ?? room.host;
      if (seat !== host) return reply(conn, { t: "err", code: "not-host", req: m.t });
      if (room.phase !== "lobby" && room.phase !== "over" && room.phase !== "end") return reply(conn, { t: "err", code: "phase", req: m.t });
      const all = [...entry.conns]; entry.conns.clear(); // giữ kết nối mở: người chơi về màn đầu, tạo / vào phòng khác ngay
      for (const c of all) { c.token = null; c.entry = null; reply(c, { t: "closed" }); }
      return dropRoom(entry);
    }
    const r = entry.room.handle(seat, m);
    if (r?.err) reply(conn, { t: "err", code: r.err, req: m.t });
  }

  function cancelGrace(entry, token) {
    const t = entry.graceTimers.get(token);
    if (t) { clearTimeout(t); entry.graceTimers.delete(token); }
  }

  function reply(conn, o) { conn.ws.send(JSON.stringify(o)); }

  attachWs(server, path, (ws, req) => {
    const ip = ipOf(req);
    if ((ipConns.get(ip) || 0) >= perIp.conns) { ws.send(JSON.stringify({ t: "err", code: "busy" })); return ws.close(1008); }
    ipConns.set(ip, (ipConns.get(ip) || 0) + 1);
    const conn = { ws, ip, entry: null, token: null, last: null, bucket: RATE.burst, at: clock.now() };
    sockets.add(ws);
    ws.on("message", (raw) => { try { onMessage(conn, raw); } catch (e) { console.error("[ai-la-noi-gian]", e); reply(conn, { t: "err", code: "server" }); } });
    ws.on("close", () => {
      sockets.delete(ws);
      const n = (ipConns.get(ip) || 1) - 1; if (n > 0) ipConns.set(ip, n); else ipConns.delete(ip);
      const entry = conn.entry; if (!entry) return;
      entry.conns.delete(conn);
      if (conn.token) {
        const seat = seatOf(entry, conn.token);
        // phòng chờ: rời hẳn sau 20 s nếu không quay lại; đang chơi: giữ ghế
        if (seat >= 0) entry.room.setConnected(seat, false);
        const token = conn.token;
        // chỉ hẹn giờ khi không còn kết nối nào khác của ghế này; mỗi token chỉ một hẹn giờ (huỷ cái cũ trước)
        if (entry.room.phase === "lobby" && ![...entry.conns].some((c) => c.token === token)) {
          cancelGrace(entry, token);
          const t = setTimeout(() => {
            if (entry.graceTimers.get(token) !== t) return;
            entry.graceTimers.delete(token);
            const s = seatOf(entry, token);
            if (s >= 0 && !entry.room.players[s].connected && entry.room.phase === "lobby") { entry.room.leave(s); if (entry.room.closed) dropRoom(entry); }
          }, (opts.lobbyGraceMs ?? 20000) + (ws.silent ? (opts.silentExtraMs ?? 45000) : 0)); t.unref?.(); // rớt im lặng (nhịp tim 15 s) ⇒ giữ thêm 45 s: tổng ≈ 80 s như trước D8
          entry.graceTimers.set(token, t);
        }
      }
      checkIdle(entry);
    });
  }, { maxBytes: 2048, allowOrigin: opts.allowOrigin, pingMs: opts.pingMs, deadMs: opts.deadMs });

  return { rooms, publicList: () => listPublicRooms(rooms, MAX_PLAYERS), close: () => { for (const e of [...rooms.values()]) dropRoom(e); for (const ws of [...sockets]) ws.close(1001); } };
}

module.exports = { createNoiGianHost };
