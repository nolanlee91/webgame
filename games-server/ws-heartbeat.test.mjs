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

async function open(port, answerPings, path = "/ws") {
  const c = net.connect(port, "127.0.0.1");
  await new Promise((r) => c.on("connect", r));
  c.write("GET " + path + " HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n");
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
  c.on("error", () => (st.ended = true));
  await sleep(50);
  for (let t0 = Date.now(); !up && Date.now() - t0 < 10000; ) await sleep(10); // chờ 101 rồi mới gửi khung (khung đi chung gói với yêu cầu HTTP sẽ bị bỏ)
  return st;
}

for (const g of games) {
  test(`${g}/ws.js: client chết bị đóng sau deadMs; client trả pong được giữ`, async () => {
    const { attachWs } = require(`./${g}/ws.js`);
    const srv = http.createServer(); const closes = [];
    attachWs(srv, "/ws", (s) => s.on("close", () => closes.push(s)), { pingMs: 80, deadMs: 500 }); // khoảng rộng: máy test bận vẫn kịp trả pong
    await new Promise((r) => srv.listen(0, "127.0.0.1", r));
    const { port } = srv.address();
    const dead = await open(port, false), alive = await open(port, true);
    try {
      for (let t0 = Date.now(); !dead.ended && Date.now() - t0 < 4000; ) await sleep(20);
      await sleep(200);
      assert.ok(alive.pings >= 3, `phải nhận ping định kỳ (nhận ${alive.pings})`);
      assert.equal(dead.ended, true, "client không trả lời phải bị đóng");
      assert.equal(alive.ended, false, "client trả pong không được bị đóng");
      assert.equal(closes.length, 1, "máy chủ phải phát sự kiện close đúng 1 lần (cho client chết)");
    } finally { dead.c.destroy(); alive.c.destroy(); srv.close(); }
  });
}

// ---- Đợt 8 (BOARD2-04): nhịp tim nhanh nhưng KHÔNG làm mất ghế sớm hơn ----
// Mặc định: ping 5 s, im lặng quá 15 s ⇒ đóng (trước 20 s / 60 s ⇒ rớt im lặng 60–80 s mới biết).
for (const g of games) {
  test(`${g}/ws.js: mặc định ping ≤ 5 s, coi là rớt sau ≤ 15 s, chịu được ≥ 2 pong lỡ`, () => {
    const { PING_MS, DEAD_MS } = require(`./${g}/ws.js`);
    assert.ok(PING_MS > 0 && PING_MS <= 5000, `PING_MS = ${PING_MS}`);
    assert.ok(DEAD_MS <= 15000, `DEAD_MS = ${DEAD_MS}`);
    assert.ok(DEAD_MS >= 2 * PING_MS, "phải chờ ít nhất 2 nhịp trước khi coi là rớt (tab nền trên điện thoại trả pong chậm)");
    assert.ok(DEAD_MS + PING_MS <= 20000, "rớt im lặng phải bị phát hiện trong ≤ 20 s");
  });
  test(`${g}/ws.js: đóng vì im lặng ⇒ socket.silent = true; đóng bình thường ⇒ không`, async () => {
    const { attachWs } = require(`./${g}/ws.js`);
    const srv = http.createServer(); const socks = [];
    attachWs(srv, "/ws", (s) => socks.push(s), { pingMs: 60, deadMs: 500 });
    await new Promise((r) => srv.listen(0, "127.0.0.1", r));
    const { port } = srv.address();
    const dead = await open(port, false), polite = await open(port, true);
    try {
      polite.c.write(Buffer.concat([Buffer.from([0x88, 0x82]), Buffer.alloc(4), Buffer.from([0x03, 0xe8])])); // khung đóng 1000, mask 0
      for (let t0 = Date.now(); Date.now() - t0 < 5000 && !(socks[0]?.silent && !socks[1]?.open); ) await sleep(20);
      assert.equal(socks.length, 2);
      assert.equal(socks[0].silent, true, "client im lặng ⇒ silent");
      assert.ok(!socks[1].silent, "client tự đóng ⇒ không silent");
    } finally { dead.c.destroy(); polite.c.destroy(); srv.close(); }
  });
}

/** khung text có mask (client → máy chủ) */
const textFrame = (s) => {
  const p = Buffer.from(s), mask = crypto.randomBytes(4), out = Buffer.from(p);
  for (let i = 0; i < out.length; i++) out[i] ^= mask[i & 3];
  const head = p.length < 126 ? Buffer.from([0x81, 0x80 | p.length]) : Buffer.from([0x81, 0xfe, p.length >> 8, p.length & 255]);
  return Buffer.concat([head, mask, out]);
};
const HOSTS = [
  ["ma-soi", "./ma-soi/host.js", "createMaSoiHost", "/ws/ma-soi"],
  ["co-caro", "./co-caro/host.js", "createCoCaroHost", "/ws/co-caro"],
  ["dat-bom", "./dat-bom/host.js", "createDatBomHost", "/ws/dat-bom"],
];
const CLOSE_FRAME = Buffer.concat([Buffer.from([0x88, 0x82]), Buffer.alloc(4), Buffer.from([0x03, 0xe8])]); // khung đóng 1000, mask 0
const waitFor = async (f, ms = 5000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = f(); if (v) return v; await sleep(20); } return f(); };
for (const [g, file, fn, path] of HOSTS) {
  test(`${g}: phòng chờ — rớt im lặng giữ ghế thêm silentExtraMs (tổng không ngắn hơn trước D8), đóng tab chỉ giữ lobbyGraceMs`, async () => {
    const srv = http.createServer();
    // nhịp tim 30 / 120 ms, giữ ghế phòng chờ 300 ms, rớt im lặng giữ thêm 3 s — khoảng cách rộng để máy test bận vẫn ổn định
    const host = require(file)[fn](srv, { path, pingMs: 30, deadMs: 120, lobbyGraceMs: 300, silentExtraMs: 3000 });
    await new Promise((r) => srv.listen(0, "127.0.0.1", r));
    const { port } = srv.address();
    const socks = [];
    try {
      if (host.ready) await Promise.race([host.ready, sleep(30000)]); // game cờ nạp logic.js (ESM) trước khi nhận phòng
      const wsOpen = async (answer, msg) => {
        const st = await open(port, answer, path); st.msgs = ""; socks.push(st);
        st.c.on("data", (d) => (st.msgs += d.toString("latin1")));
        st.c.write(textFrame(JSON.stringify(msg))); return st;
      };
      const pair = async (answerHost) => {
        const a = await wsOpen(answerHost, { t: "create", name: "Chủ Phòng", public: true });
        const code = await waitFor(() => /"code":"([A-Z0-9]{5})"/.exec(a.msgs)?.[1], 15000);
        assert.ok(code, "tạo được phòng: " + a.msgs.slice(0, 200));
        const n = () => host.rooms.get(code)?.room.players.filter((p) => !p.left && !p.bot).length ?? 0;
        await wsOpen(true, { t: "join", code, name: "Khách Một" });
        assert.ok(await waitFor(() => n() === 2), "khách vào được phòng");
        return { a, n, code };
      };
      const tS = Date.now(); // chủ phòng 1 im lặng từ lúc này (không trả pong)
      const s = await pair(false), p = await pair(true);
      assert.equal(s.n(), 2, "rớt im lặng: chưa mất ghế ngay");
      const t0 = Date.now();
      p.a.c.write(CLOSE_FRAME); // chủ phòng 2 đóng tab đàng hoàng
      assert.ok(await waitFor(() => p.n() === 1, 2500), "đóng tab ⇒ rời phòng sau lobbyGraceMs (300 ms) như cũ");
      const tp = Date.now() - t0;
      assert.ok(tp >= 250, `đóng tab: không rời sớm hơn lobbyGraceMs (${tp} ms)`);
      // im lặng: bị đóng ở 120–150 ms; không có phần cộng thêm thì ~450 ms đã mất ghế; có thì ~3,45 s
      await sleep(Math.max(0, 1500 - (Date.now() - tS)));
      assert.equal(s.n(), 2, "rớt im lặng: vẫn giữ ghế ở 1,5 s");
      assert.ok(await waitFor(() => s.n() === 1, 6000), "hết deadMs + lobbyGrace + silentExtra ⇒ mới rời phòng");
      assert.ok(Date.now() - tS >= 3000, "rớt im lặng: rời không sớm hơn silentExtraMs");
    } finally { for (const x of socks) x.c.destroy(); host.close(); srv.close(); }
  });
}
