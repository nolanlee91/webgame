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

module.exports = { listPublicRooms };
