// PARTY2-03 (D8): Ma Sói / Nội Gián — chủ phòng đóng tab mà máy chủ chưa nhận khung đóng, ván kết thúc ⇒ máy chủ ping chủ phòng,
// không có trả lời trong endProbeMs ⇒ chuyển chủ phòng cho người kế tiếp NGAY (không chờ nhịp tim 15 s), người đó bấm "Chơi ván mới" được.
// Chủ phòng còn trả pong ⇒ giữ nguyên chủ phòng. `node --test games-server/end-host.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import http from "node:http";
import net from "node:net";
import crypto from "node:crypto";

const require = createRequire(import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const textFrame = (s) => {
  const p = Buffer.from(s), mask = crypto.randomBytes(4), out = Buffer.from(p);
  for (let i = 0; i < out.length; i++) out[i] ^= mask[i & 3];
  return Buffer.concat([Buffer.from([0x81, 0x80 | p.length]), mask, out]);
};
/** client thô: KHÔNG trả pong (giống tab đã đóng mà TCP chưa đứt) trừ khi answer = true */
async function raw(port, path, answer) {
  const c = net.connect(port, "127.0.0.1"); const st = { c, msgs: "", up: false };
  await new Promise((r) => c.on("connect", r)); c.on("error", () => {});
  c.write(`GET ${path} HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n`);
  c.on("data", (d) => {
    if (!st.up) { st.up = true; return; }
    st.msgs += d.toString("latin1");
    if (answer) for (let i = 0; i + 1 < d.length; i++) if (d[i] === 0x89 && d[i + 1] === 0) c.write(Buffer.concat([Buffer.from([0x8a, 0x80]), crypto.randomBytes(4)]));
  });
  for (let t0 = Date.now(); !st.up && Date.now() - t0 < 10000; ) await sleep(10); // chờ 101 rồi mới gửi khung
  return st;
}

const GAMES = [
  ["ma-soi", "./ma-soi/host.js", "createMaSoiHost", "wolf"],
  ["ai-la-noi-gian", "./ai-la-noi-gian/host.js", "createNoiGianHost", "agency"],
];
for (const [g, file, fn, winner] of GAMES) {
  for (const answer of [false, true]) {
    test(`${g}: hết ván, chủ phòng ${answer ? "còn trả pong ⇒ vẫn là chủ phòng" : "im lặng ⇒ người kế tiếp thành chủ phòng trong ~endProbeMs, mở được ván mới"}`, async () => {
      const srv = http.createServer();
      const path = `/ws/${g}`;
      const host = require(file)[fn](srv, { path, endProbeMs: 600, pingMs: 60000, deadMs: 120000 }); // tắt nhịp tim thường để chỉ thử phép dò lúc hết ván
      await new Promise((r) => srv.listen(0, "127.0.0.1", r));
      const { port } = srv.address();
      let a = null, b = null;
      const until = async (f, ms) => { for (let t0 = Date.now(); !f() && Date.now() - t0 < ms; ) await sleep(20); return f(); };
      try {
        a = await raw(port, path, answer);
        a.c.write(textFrame(JSON.stringify({ t: "create", name: "Chủ Phòng" })));
        let code; await until(() => (code = /"code":"([A-Z0-9]{5})"/.exec(a.msgs)?.[1]), 10000);
        assert.ok(code, "tạo được phòng");
        b = new WebSocket(`ws://127.0.0.1:${port}${path}`);
        await new Promise((r) => (b.onopen = r));
        b.send(JSON.stringify({ t: "join", code, name: "Khách Một" }));
        const room = host.rooms.get(code).room;
        assert.ok(await until(() => room.players.length === 2, 10000), "khách vào được");
        assert.equal(room.host, 0);
        room.winner = winner;
        const t0 = Date.now();
        room._enter("end", 0); // ván kết thúc
        if (answer) {
          await sleep(1500);
          assert.equal(room.host, 0, "chủ phòng còn trả pong ⇒ giữ nguyên");
          assert.equal(room.players[0].connected, true);
        } else {
          assert.ok(await until(() => room.host === 1, 5000), "chủ phòng im lặng ⇒ chuyển cho người kế tiếp");
          assert.ok(Date.now() - t0 >= 500, "không chuyển trước endProbeMs");
          assert.equal(room.players[0].connected, false);
          assert.equal(room.players.length, 2, "chủ cũ vẫn giữ ghế (chỉ mất kết nối)");
          b.send(JSON.stringify({ t: "again" }));
          assert.ok(await until(() => room.phase === "lobby", 3000), "chủ phòng mới bấm Chơi ván mới ⇒ về phòng chờ");
        }
      } finally { a?.c.destroy(); try { b?.close(); } catch {} host.close(); srv.close(); }
    });
  }
}
