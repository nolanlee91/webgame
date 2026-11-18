function listPublicRooms(rooms, max) {
  const result = [];
  for (const { room, public: isPublic } of rooms.values()) {
    if (!isPublic || room.closed || room.phase !== "lobby" || room.players.length >= max) continue;
    if (!room.players.some((player) => player.connected && !player.bot)) continue;
    result.push({
      code: room.code,
      host: room.players[room.hostSeat ?? room.host]?.name || "",
      n: room.players.length,
      max,
    });
  }
  return result;
}

module.exports = { listPublicRooms };
