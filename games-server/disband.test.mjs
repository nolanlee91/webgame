// Chủ phòng "Hủy phòng": khách không hủy được; chủ hủy ⇒ mọi người nhận {t:"closed"}, phòng biến mất, kết nối vẫn mở
// để tạo / vào phòng khác ngay. Chạy qua WebSocket thật trên mọi game online có phòng chờ. `npm run test:disband`
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const GAMES = [
  ["co-caro", "createCoCaroHost"], ["co-vua", "createCoVuaHost"], ["co-tuong", "createCoTuongHost"], ["dat-bom", "createDatBomHost"],
  ["co-ty-phu", "createCoTyPhuHost"], ["co-ca-ngua", "createCoCaNguaHost"], ["ma-soi", "createMaSoiHost"], ["ai-la-noi-gian", "createNoiGianHost"],
];

function client(url) {
  const ws = new WebSocket(url), msgs = [], waiters = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); msgs.push(m); for (const w of [...waiters]) if (w.f(m)) { waiters.splice(waiters.indexOf(w), 1); w.r(m); } };
  const c = {
    ws, msgs, open: new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }),
    send: (o) => ws.send(JSON.stringify(o)),
    next: (f, ms = 3000) => { const hit = msgs.find(f); if (hit) { msgs.splice(msgs.indexOf(hit), 1); return Promise.resolve(hit); }
      return new Promise((r, j) => { const w = { f, r: (m) => { msgs.splice(msgs.indexOf(m), 1); r(m); } }; waiters.push(w); setTimeout(() => j(new Error("hết giờ chờ tin")), ms); }); },
  };
  return c;
}

for (const [game, fn] of GAMES) {
  test(`${game}: chỉ chủ phòng hủy được; hủy ⇒ cả phòng nhận "closed", phòng bị xoá`, async () => {
    const server = http.createServer((q, s) => s.end("x"));
    const host = require(`./${game}/host.js`)[fn](server, { lobbyGraceMs: 200 });
    await host.ready;
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const url = `ws://127.0.0.1:${server.address().port}/ws/${game}`;
    const A = client(url), B = client(url);
    try {
      await A.open; await B.open;
      A.send({ t: "create", name: "Chu", public: true });
      const { code } = await A.next((m) => m.t === "joined");
      B.send({ t: "join", code, name: "Khach" });
      await B.next((m) => m.t === "joined");
      B.send({ t: "disband" });
      assert.equal((await B.next((m) => m.t === "err")).code, "not-host");
      assert.ok(host.rooms.has(code), "khách hủy không được");
      A.send({ t: "disband" });
      await A.next((m) => m.t === "closed"); await B.next((m) => m.t === "closed");
      assert.equal(host.rooms.has(code), false, "phòng phải bị xoá");
      assert.equal(A.ws.readyState, 1, "kết nối vẫn mở");
      A.send({ t: "create", name: "Chu", public: false }); // tạo phòng mới ngay trên kết nối cũ
      assert.ok((await A.next((m) => m.t === "joined")).code);
    } finally { A.ws.close(); B.ws.close(); host.close(); server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
  });
}
