// Vào lại ghế bằng token khi ĐANG CHƠI (đóng tab rồi mở lại link mời / mở tab thứ hai) — chạy qua WebSocket thật
// trên cả 6 game bàn cờ online. Client giữ token trong localStorage theo mã phòng (net.js / online.js) rồi gửi "resume".
// `node --test --test-concurrency=1 games-server/resume.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// [game, hàm tạo host, nước đi thử (gửi từ cả hai người — người không tới lượt bị từ chối "not-turn")]
const GAMES = [
  ["co-caro", "createCoCaroHost", { t: "move", r: 7, c: 7 }],
  ["co-vua", "createCoVuaHost", null],
  ["co-tuong", "createCoTuongHost", null],
  ["o-an-quan", "createOAnQuanHost", (v) => ({ t: "move", pit: v.you % 2 ? 7 : 1, dir: 1 })],
  ["co-ca-ngua", "createCoCaNguaHost", null],
  ["co-ty-phu", "createCoTyPhuHost", null],
];

function client(url) {
  const ws = new WebSocket(url), msgs = [], waiters = [];
  const c = { ws, msgs, v: null, token: null, code: null };
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data); msgs.push(m);
    if (m.t === "state") c.v = m.v;
    if (m.t === "joined") { c.code = m.code; c.token = m.token; }
    for (const w of [...waiters]) if (w.f(m)) { waiters.splice(waiters.indexOf(w), 1); w.r(m); }
  };
  c.open = new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  c.closed = new Promise((r) => ws.addEventListener("close", r));
  c.send = (o) => ws.send(JSON.stringify(o));
  // chờ tin thỏa f (kể cả trạng thái mới nhất đã nhận)
  c.next = (f, ms = 3000) => {
    if (c.v && f({ t: "state", v: c.v })) return Promise.resolve({ t: "state", v: c.v });
    return new Promise((r, j) => {
      const w = { f, r }; waiters.push(w);
      setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) { waiters.splice(i, 1); j(new Error("hết giờ chờ — tin cuối: " + JSON.stringify(msgs.at(-1)).slice(0, 200))); } }, ms);
    });
  };
  c.err = async (o) => { c.send(o); return (await c.next((m) => m.t === "err")).code; };
  return c;
}
const st = (f) => (m) => m.t === "state" && f(m.v);

async function setup(game, fn) {
  const server = http.createServer((q, s) => s.end("x"));
  const host = require(`./${game}/host.js`)[fn](server, { lobbyGraceMs: 150 });
  await host.ready;
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `ws://127.0.0.1:${server.address().port}/ws/${game}`;
  const open = [];
  const mk = async () => { const c = client(url); open.push(c); await c.open; return c; };
  const stop = async () => { for (const c of open) c.ws.close(); host.close(); server.closeAllConnections?.(); await new Promise((r) => server.close(r)); };
  return { host, url, mk, stop };
}

async function pair(S) {
  const a = await S.mk(), b = await S.mk();
  a.send({ t: "create", name: "An", public: false }); await a.next((m) => m.t === "joined");
  b.send({ t: "join", code: a.code, name: "Binh" }); await b.next((m) => m.t === "joined");
  await a.next(st((v) => v.players.length === 2));
  return [a, b];
}
async function started(S, act) {
  const [a, b] = await pair(S);
  a.send({ t: "start" });
  await a.next(st((v) => v.phase === "play")); await b.next(st((v) => v.phase === "play"));
  if (act) { // một nước đi thật để bàn cờ khác trạng thái lúc đầu
    const seq = a.v.seq;
    for (const c of [a, b]) c.send(typeof act === "function" ? act(c.v) : act);
    await a.next(st((v) => v.seq > seq)); await b.next(st((v) => v.seq > seq));
  }
  return [a, b];
}

for (const [game, fn, act] of GAMES) {
  test(`${game}: đóng tab giữa ván → vào lại bằng token ⇒ đúng ghế, đúng bàn; người kia thấy connected:false`, async () => {
    const S = await setup(game, fn);
    try {
      const [a, b] = await started(S, act);
      const before = b.v, code = b.code, token = b.token;
      b.ws.close(); await b.closed; // đóng hẳn tab
      await a.next(st((v) => v.players[before.you].connected === false));
      assert.equal(S.host.rooms.get(code).room.phase, "play", "ván vẫn tiếp tục, không về phòng chờ");
      // join mới bị từ chối (ván đang chơi) — đây là lỗi cũ khi client không giữ token
      const c = await S.mk();
      assert.ok(["started", "full"].includes(await c.err({ t: "join", code, name: "Binh" })));
      const b2 = await S.mk();
      b2.send({ t: "resume", code: code.toLowerCase(), token });
      const j = await b2.next((m) => m.t === "joined");
      assert.equal(j.token, token); assert.equal(j.code, code);
      const after = (await b2.next((m) => m.t === "state")).v;
      assert.equal(after.you, before.you, "đúng ghế cũ");
      assert.equal(after.gid, before.gid); assert.equal(after.seq, before.seq);
      assert.deepEqual(after.game, before.game, "bàn cờ giữ nguyên");
      assert.equal(after.players[before.you].connected, true);
      await a.next(st((v) => v.players[before.you].connected === true));
    } finally { await S.stop(); }
  });

  test(`${game}: token sai / hỏng bị từ chối (no-seat), mã phòng sai báo no-room`, async () => {
    const S = await setup(game, fn);
    try {
      const [a] = await started(S, null);
      const x = await S.mk();
      assert.equal(await x.err({ t: "resume", code: a.code, token: "f".repeat(32) }), "no-seat");
      const y = await S.mk();
      assert.equal(await y.err({ t: "resume", code: a.code, token: "abc" }), "no-seat");
      const z = await S.mk();
      assert.equal(await z.err({ t: "resume", code: "ZZZZZ", token: a.token }), "no-room");
      assert.equal(a.v.players[0].connected, true, "ghế thật không bị đụng tới");
    } finally { await S.stop(); }
  });

  test(`${game}: tab thứ hai cùng người ⇒ tab cũ nhận "replaced", tab mới giữ ghế`, async () => {
    const S = await setup(game, fn);
    try {
      const [a, b] = await started(S, act);
      const you = b.v.you;
      const b2 = await S.mk(), gone = b.next((m) => m.t === "replaced");
      b2.send({ t: "resume", code: b.code, token: b.token });
      await b2.next((m) => m.t === "joined");
      await gone; await b.closed;
      assert.equal((await b2.next((m) => m.t === "state")).v.you, you);
      await sleep(50);
      assert.equal(a.v.players[you].connected, true, "tab cũ đóng không làm ghế thành mất kết nối");
    } finally { await S.stop(); }
  });

  test(`${game}: phòng đã hết / ghế đã hết hạn ⇒ resume báo lỗi, client vào mới bằng join`, async () => {
    const S = await setup(game, fn);
    try {
      // (1) phòng chờ: rớt quá hạn ⇒ mất ghế (no-seat) ⇒ join mới vẫn vào được cùng phòng
      const [a, b] = await pair(S);
      const code = a.code, old = b.token;
      b.ws.close(); await b.closed;
      await a.next(st((v) => v.players.length === 1));
      const b2 = await S.mk();
      assert.equal(await b2.err({ t: "resume", code, token: old }), "no-seat");
      b2.send({ t: "join", code, name: "Binh" });
      const j = await b2.next((m) => m.t === "joined");
      assert.notEqual(j.token, old, "token mới");
      // (2) phòng đã hết (mọi người rời) ⇒ no-room
      for (const c of [a, b2]) { c.send({ t: "leave" }); await c.next((m) => m.t === "left"); }
      assert.equal(S.host.rooms.has(code), false);
      const b3 = await S.mk();
      assert.equal(await b3.err({ t: "resume", code, token: j.token }), "no-room");
    } finally { await S.stop(); }
  });
}
