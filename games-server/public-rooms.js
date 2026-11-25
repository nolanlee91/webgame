// Sảnh chờ công khai trên trang chủ (/api/lobby). Tên chủ phòng đã được lọc ở room.js; ở đây lọc LẠI (phòng thủ 2 lớp) —
// danh sách này ai cũng xem được nên tuyệt đối không được lộ tên chưa lọc. Bộ lọc: games-server/moderation.js.
const { cleanPlayerName } = require("./moderation");

const hostName = (name) => (name ? cleanPlayerName(name) : "");

function listPublicRooms(rooms, seats) {
  const result = [];
  for (const { room, public: isPublic } of rooms.values()) {
    const max = typeof seats === "function" ? seats(room) : seats;
    if (!isPublic || room.closed || room.phase !== "lobby" || room.players.length >= max) continue;
    if (!room.players.some((player) => player.connected && !player.bot)) continue;
    result.push({
      code: room.code,
      host: hostName(room.players[room.hostSeat ?? room.host]?.name),
      n: room.players.length,
      max,
    });
  }
  return result;
}

/** Đếm người thật đang kết nối trong một phòng + phòng đã vào ván chưa (P-F: tab "Đang diễn ra" trên trang chủ).
 *  Hai dạng phòng: { room: { phase, players[{connected, bot}], closed } } (đa số game) và Nối Từ { seats[{token}], conns, ref }.
 *  Không trả mã phòng / tên người: chỉ số đếm, ai cũng xem được. Dạng lạ ⇒ bỏ qua (không ném lỗi làm hỏng /api/lobby). */
function roomPulse(entry) {
  try {
    const r = entry && entry.room;
    if (r && Array.isArray(r.players)) {
      if (r.closed) return null;
      const n = r.players.filter((p) => p && p.connected && !p.bot).length;
      return n ? { n, playing: r.phase !== "lobby" } : null;
    }
    if (entry && Array.isArray(entry.seats)) {
      const conns = [...(entry.conns || [])];
      const n = entry.seats.filter((s) => s && conns.some((c) => c && c.ws && c.ws.open && c.token === s.token)).length;
      return n ? { n, playing: !!entry.ref } : null;
    }
  } catch {}
  return null;
}

/** Tóm tắt sảnh: { players: tổng người thật đang kết nối, playing: [{ game, rooms, n }] các game có ván đang chơi (nhiều bàn trước) }.
 *  hosts: Map(game → { rooms: Map }). */
function lobbyPulse(hosts) {
  let players = 0;
  const playing = [];
  for (const [game, host] of hosts) {
    let rooms = 0, n = 0;
    for (const entry of (host && host.rooms && typeof host.rooms.values === "function" ? host.rooms.values() : [])) {
      const p = roomPulse(entry);
      if (!p) continue;
      players += p.n;
      if (p.playing) { rooms++; n += p.n; }
    }
    if (rooms) playing.push({ game, rooms, n });
  }
  playing.sort((a, b) => b.n - a.n || b.rooms - a.rooms);
  return { players, playing };
}

module.exports = { listPublicRooms, lobbyPulse, roomPulse };
