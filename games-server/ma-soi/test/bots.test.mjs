// Bot Ma Sói (games-server/ma-soi/room.js): chạy trực tiếp trên Room với đồng hồ giả — không cần WebSocket.
// Chạy: node --test games-server/ma-soi/test/bots.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Room, ROLES } = require("../room.js");

function fakeClock() {
  let t = 0, q = [];
  return {
    now: () => t,
    setTimeout: (f, ms) => { const h = { f, at: t + ms }; q.push(h); return h; },
    clearTimeout: (h) => { q = q.filter((x) => x !== h); },
    step() { q.sort((a, b) => a.at - b.at); const h = q.shift(); if (!h) return false; t = h.at; h.f(); return true; },
  };
}
function rng(seed) { let a = seed >>> 0 || 1; return (n) => { a = (a * 1103515245 + 12345) >>> 0; return a % n; }; }
function room(seed = 1) {
  const clock = fakeClock();
  const r = new Room({ code: "TEST1", clock, randInt: rng(seed) });
  return { r, clock };
}

test("chủ phòng thêm / bớt bot; người khác không thêm được; bot không nhận lệnh từ mạng", () => {
  const { r } = room();
  r.join("Chủ", "a".repeat(32)); r.join("Khách", "b".repeat(32));
  assert.equal(r.handle(1, { t: "add-bot" }).err, "not-host");
  for (let i = 0; i < 4; i++) assert.ok(r.handle(0, { t: "add-bot" }).ok);
  assert.equal(r.players.filter((p) => p.bot).length, 4);
  assert.ok(r.players.every((p, i) => p.seat === i));
  assert.equal(r.handle(2, { t: "chat", text: "giả bot" }).err, "gone", "ghế bot không nhận lệnh");
  assert.ok(r.viewFor(0).players[2].bot, "cờ bot công khai");
  assert.equal(r.handle(0, { t: "kick-bot", target: 1 }).err, "target", "không bớt được người thật");
  assert.ok(r.handle(0, { t: "kick-bot", target: 2 }).ok);
  assert.equal(r.players.length, 5);
  for (let i = 0; i < 4; i++) r.handle(0, { t: "add-bot" });
  assert.equal(r.players.length, 8); assert.equal(r.handle(0, { t: "add-bot" }).err, "full");
});

test("chỉ còn bot trong phòng chờ ⇒ đóng phòng; chủ phòng rời ⇒ chuyển cho người thật", () => {
  const { r } = room();
  r.join("Chủ", "a".repeat(32)); r.join("Khách", "b".repeat(32)); r.handle(0, { t: "add-bot" });
  r.leave(0);
  assert.equal(r.players[r.host].name, "Khách");
  r.leave(r.host);
  assert.ok(r.closed);
});

for (const n of [6, 7, 8]) test(`1 người + ${n - 1} bot: cả ván tự chạy tới khi có phe thắng (người thật không làm gì)`, () => {
  for (let seed = 1; seed <= 15; seed++) {
    const { r, clock } = room(seed);
    r.join("Người", "a".repeat(32));
    for (let i = 1; i < n; i++) r.handle(0, { t: "add-bot" });
    assert.ok(r.handle(0, { t: "start" }).ok);
    let steps = 0;
    while (r.phase !== "end" && steps < 5000 && clock.step()) steps++;
    assert.equal(r.phase, "end", `seed ${seed}: ván phải kết thúc (đang ${r.phase} sau ${steps} bước)`);
    assert.ok(["wolf", "village"].includes(r.winner));
    assert.ok(r.round <= n, `seed ${seed}: ${r.round} vòng là quá dài cho ${n} người`);
  }
});

test("Sói-bot đi theo mục tiêu của Sói là người thật", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const { r, clock } = room(seed);
    r.join("Người", "a".repeat(32));
    for (let i = 1; i < 6; i++) r.handle(0, { t: "add-bot" });
    r.handle(0, { t: "start" });
    if (r.players[0].role !== ROLES.wolf) continue;
    while (r.phase !== "night") clock.step();
    const target = r.players.find((p) => p.role !== ROLES.wolf && p.role !== ROLES.guard); // bảo vệ có thể che ⇒ chọn người khác bảo vệ
    assert.ok(r.handle(0, { t: "act", target: target.seat }).ok);
    const guardBefore = () => r.night?.guard;
    let g = null;
    while (r.phase === "night") { g = guardBefore(); clock.step(); }
    const ev = r.events.at(-1);
    if (g === target.seat) assert.equal(ev.kind, "peace");
    else assert.equal(ev.seat, target.seat, `seed ${seed}: bầy phải cắn đúng người Sói thật đã chọn`);
    return;
  }
  assert.fail("không có seed nào chia vai Sói cho người thật");
});

test("chơi lại: giữ bot, chủ phòng vẫn là người thật, không còn hẹn giờ bot cũ", () => {
  const { r, clock } = room(3);
  r.join("Người", "a".repeat(32));
  for (let i = 1; i < 6; i++) r.handle(0, { t: "add-bot" });
  r.handle(0, { t: "start" });
  while (r.phase !== "end" && clock.step());
  assert.ok(r.handle(0, { t: "again" }).ok);
  assert.equal(r.phase, "lobby"); assert.equal(r.players.length, 6);
  assert.equal(r.players[r.host].bot, false);
  assert.equal(r.botTimers.length, 0);
});
