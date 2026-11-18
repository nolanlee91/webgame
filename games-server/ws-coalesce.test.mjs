// Hồi quy: nhiều khung WebSocket hợp lệ dồn chung MỘT lần ghi TCP không được làm máy chủ ngắt nhầm (1009).
// Chạy trên mọi bản sao games-server/*/ws.js. `npm run test:ws`
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

function frame(text) {
  const p = Buffer.from(text), mask = crypto.randomBytes(4), n = p.length;
  const h = n < 126 ? Buffer.from([0x81, 0x80 | n]) : Buffer.from([0x81, 0x80 | 126, n >> 8, n & 255]);
  for (let i = 0; i < n; i++) p[i] ^= mask[i & 3];
  return Buffer.concat([h, mask, p]);
}

for (const g of games) {
  test(`${g}/ws.js: 3 khung ~700 byte (maxBytes 1024) chung một lần ghi ⇒ nhận đủ 3 tin, không đóng`, async () => {
    const { attachWs } = require(`./${g}/ws.js`);
    const srv = http.createServer(); let got = 0, closed = false;
    attachWs(srv, "/ws", (s) => { s.on("message", () => got++); s.on("close", () => (closed = true)); }, { maxBytes: 1024 });
    await new Promise((r) => srv.listen(0, "127.0.0.1", r));
    const c = net.connect(srv.address().port, "127.0.0.1");
    try {
      await new Promise((r) => c.on("connect", r));
      c.write("GET /ws HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n");
      await new Promise((r) => c.once("data", r));
      c.write(Buffer.concat([0, 1, 2].map((i) => frame(JSON.stringify({ t: "chat", i, pad: "x".repeat(680) })))));
      await new Promise((r) => setTimeout(r, 150));
      assert.equal(closed, false, "máy chủ đã ngắt kết nối");
      assert.equal(got, 3);
    } finally { c.destroy(); srv.close(); }
  });
}
