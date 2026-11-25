// Mỗi máy chủ phòng online đều đưa tên + chat qua bộ lọc dùng chung (games-server/moderation.js):
// tên tục ⇒ tên thay thế (không bao giờ lưu / phát / hiện ở sảnh chờ trang chủ), chat tục ⇒ ***, link ⇒ [link].
// `node --test games-server/moderation-rooms.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { listPublicRooms } = require("./public-rooms.js");
const clock = { now: () => 1_000_000, setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {} };
const logic = (g) => import(new URL(`../prototype/games/${g}/logic.js`, import.meta.url).href);

for (const g of ["co-caro", "co-vua", "co-tuong", "o-an-quan", "co-ca-ngua", "co-ty-phu", "dat-bom"]) {
  test(`${g}: tên tục ⇒ "Người N", chat tục ⇒ ***, sảnh chờ công khai không lộ tên gốc`, async () => {
    const { Room } = require(`./${g}/room.js`);
    const room = new Room({ code: "ABCDE", L: await logic(g), A: {}, clock, randInt: () => 0, rand: () => 0.5 });
    room.join("👑 Cặc Bự", "a".repeat(32), "1.1.1.1");
    assert.equal(room.players[0].name, "Người 1");
    assert.deepEqual(listPublicRooms(new Map([["ABCDE", { room, public: true }]]), 4).map((r) => r.host), ["Người 1"]);
    room.join("Lâm 🐱", "b".repeat(32), "2.2.2.2");
    assert.equal(room.players[1].name, "Lâm 🐱");
    assert.ok(room.handle(1, { t: "chat", text: "mày ngu vcl, vào zalo.me/x nhé" })?.ok);
    assert.ok(room.handle(0, { t: "chat", text: "các bạn ơi lớn lên đi chợ" })?.ok);
    const chat = room.viewFor(0).chat;
    assert.deepEqual(chat.map((c) => c.text), ["mày ngu ***, vào [link] nhé", "các bạn ơi lớn lên đi chợ"]);
    assert.equal(chat[0].name, "Lâm 🐱");
    room.close?.();
  });
}

const mkSocial = (g) => {
  const { Room } = require(`./${g}/room.js`);
  return new Room({ code: "ABCDE", clock, randInt: () => 0, timings: {} });
};

for (const g of ["ma-soi", "ai-la-noi-gian"]) {
  test(`${g}: tên tục ⇒ "Người chơi N" (không trùng nhau), chat tục ⇒ ***`, () => {
    const room = mkSocial(g);
    assert.deepEqual(room.join("địt mẹ mày", "t0"), { seat: 0 });
    assert.deepEqual(room.join("Fuck You", "t1"), { seat: 1 });
    assert.equal(room.join("​ ‮ ", "t2").err, "name");
    room.join("Lâm", "t2");
    assert.deepEqual(room.players.map((p) => p.name), ["Người chơi 1", "Người chơi 2", "Lâm"]);
    assert.deepEqual(listPublicRooms(new Map([["ABCDE", { room, public: true }]]), 8).map((r) => r.host), ["Người chơi 1"]);
    assert.ok(room.handle(2, { t: "chat", text: "đ ụ má tụi bây, cực kỳ vui" }).ok);
    assert.equal(room.viewFor(0).chat.at(-1).text, "*** má tụi bây, cực kỳ vui");
    room.close?.();
  });
}
