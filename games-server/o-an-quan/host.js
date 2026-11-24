// Máy chủ phòng Ô Ăn Quan (1v1 / 2v2) — dùng chung khung createRoomHost của Cờ Caro (mã phòng, token, resume, chống spam,
// hủy phòng, danh sách phòng công khai). Luật + máy đánh thay là ES module dùng chung với trình duyệt, nạp bằng import().
"use strict";
const path = require("path");
const { pathToFileURL } = require("url");
const { createRoomHost } = require("../co-caro/host");
const { Room } = require("./room");

const GAME_DIR = path.join(__dirname, "..", "..", "prototype", "games", "o-an-quan");
const load = (f) => import(pathToFileURL(path.join(GAME_DIR, f)).href);

function createOAnQuanHost(server, opts = {}) {
  return createRoomHost(server, opts, {
    id: "o-an-quan",
    Room,
    trustProxyEnv: "OANQUAN_TRUST_PROXY",
    load: () => Promise.all([opts.logic || load("logic.js"), opts.ai || load("ai.js")]),
    seats: (room) => room.max, // phòng 2v2 hiện "n/4" trong danh sách phòng công khai
  });
}

module.exports = { createOAnQuanHost };
