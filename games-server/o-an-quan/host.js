"use strict";
const { createRoomHost } = require("../co-caro/host");
const { Room } = require("./room");

function createOAnQuanHost(server, opts) {
  return createRoomHost(server, opts, {
    id: "o-an-quan",
    Room,
    trustProxyEnv: "OANQUAN_TRUST_PROXY",
    load: () => Promise.resolve([{}, null]),
    seats: (room) => room.max,
  });
}

module.exports = { createOAnQuanHost };
