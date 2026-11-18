// Nhịp tim WebSocket: máy chủ ping định kỳ; client im lặng quá deadMs bị đóng (phòng không treo trong RAM),
// client trả pong thì giữ kết nối. Chạy trên mọi bản sao games-server/*/ws.js. `npm run test:ws`
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readdirSync, existsSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import crypto from "node:crypto";

const require = createRequire(import.meta.url);
const dir = new URL(".", import.meta.url);
const games = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(new URL(`${d.name}/ws.js`, dir))).map((d) => d.name);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(port, answerPings) {
  const c = net.connect(port, "127.0.0.1");
  await new Promise((r) => c.on("connect", r));
  c.write("GET /ws HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n");
  let up = false;
  const st = { pings: 0, ended: false, c };
  c.on("data", (d) => {
    if (!up) { up = true; return; }
    for (let i = 0; i + 1 < d.length; i++) if (d[i] === 0x89 && d[i + 1] === 0) {
      st.pings++;
      if (answerPings) c.write(Buffer.concat([Buffer.from([0x8a, 0x80]), crypto.randomBytes(4)])); // pong rỗng, có mask
    }
  });
  c.on("close", () => (st.ended = true));
  await sleep(50);
  return st;
}

for (const g of games) {
  test(`${g}/ws.js: client chết bị đóng sau deadMs; client trả pong được giữ`, async () => {
    const { attachWs } = require(`./${g}/ws.js`);
    const srv = http.createServer(); const closes = [];
    attachWs(srv, "/ws", (s) => s.on("close", () => closes.push(s)), { pingMs: 40, deadMs: 200 });
    await new Promise((r) => srv.listen(0, "127.0.0.1", r));
    const { port } = srv.address();
    const dead = await open(port, false), alive = await open(port, true);
    try {
      await sleep(450);
      assert.ok(alive.pings >= 3, `phải nhận ping định kỳ (nhận ${alive.pings})`);
      assert.equal(dead.ended, true, "client không trả lời phải bị đóng");
      assert.equal(alive.ended, false, "client trả pong không được bị đóng");
      assert.equal(closes.length, 1, "máy chủ phải phát sự kiện close đúng 1 lần (cho client chết)");
    } finally { dead.c.destroy(); alive.c.destroy(); srv.close(); }
  });
}
