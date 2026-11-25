// P-F (D5): /api/lobby thêm { players, playing } cho tab "Đang diễn ra" trên trang chủ — rooms giữ nguyên dạng cũ.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { lobbyPulse, roomPulse } = require("./public-rooms.js");

const p = (connected, bot = false) => ({ connected, bot, name: "x" });
const std = (phase, players, extra = {}) => ({ room: { phase, players, ...extra }, public: true });
const noiTu = (tokens, open, ref) => ({ seats: tokens.map((t) => ({ token: t, name: "x" })), conns: new Set(open.map((t) => ({ token: t, ws: { open: true } }))), ref });

test("roomPulse: chỉ đếm người thật đang kết nối; phòng đóng / không ai ⇒ null; dạng lạ không ném lỗi", () => {
  assert.deepEqual(roomPulse(std("play", [p(true), p(false), p(true, true)])), { n: 1, playing: true });
  assert.deepEqual(roomPulse(std("lobby", [p(true), p(true)])), { n: 2, playing: false });
  assert.equal(roomPulse(std("play", [p(false), p(true, true)])), null);
  assert.equal(roomPulse(std("play", [p(true)], { closed: true })), null);
  assert.deepEqual(roomPulse(noiTu(["a", "b"], ["a", "b"], {})), { n: 2, playing: true });
  assert.deepEqual(roomPulse(noiTu(["a"], ["a"], null)), { n: 1, playing: false });
  assert.equal(roomPulse(noiTu(["a"], [], {})), null);
  for (const bad of [null, undefined, {}, { room: null }, { room: { players: "x" } }, { seats: [null] }]) assert.equal(roomPulse(bad), null);
});

test("lobbyPulse: tổng người + danh sách game đang chơi (nhiều người trước), không lộ mã phòng / tên", () => {
  const hosts = new Map([
    ["co-caro", { rooms: new Map([["AAAAA", std("play", [p(true), p(true)])], ["BBBBB", std("lobby", [p(true)])], ["CCCCC", std("over", [p(true), p(false)])]]) }],
    ["ma-soi", { rooms: new Map([["DDDDD", std("night", [p(true), p(true), p(true), p(true), p(true, true)])]]) }],
    ["noi-tu", { rooms: new Map([["EEEEE", noiTu(["a", "b"], ["a"], {})]]) }],
    ["co-vua", { rooms: new Map() }],
    ["hong", {}],
  ]);
  const r = lobbyPulse(hosts);
  assert.equal(r.players, 2 + 1 + 1 + 4 + 1);
  assert.deepEqual(r.playing, [{ game: "ma-soi", rooms: 1, n: 4 }, { game: "co-caro", rooms: 2, n: 3 }, { game: "noi-tu", rooms: 1, n: 1 }]);
  assert.ok(!JSON.stringify(r).includes("AAAAA") && !JSON.stringify(r).includes('"x"'));
});

test("GET /api/lobby: vẫn có rooms (dạng cũ) + players (số) + playing (mảng)", async () => {
  const server = require("../server.js");
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/lobby`);
    assert.equal(res.status, 200);
    const j = await res.json();
    assert.ok(Array.isArray(j.rooms));
    assert.equal(typeof j.players, "number");
    assert.ok(Array.isArray(j.playing));
  } finally {
    await new Promise((ok) => server.close(ok));
    server.closeAllConnections?.();
  }
});
