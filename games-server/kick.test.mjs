// Chủ phòng "Mời ra" (games-server/kick.js) qua WebSocket thật trên 9 game có phòng chờ dạng khuôn chung
// (Nối Từ có test riêng trong games-server/noi-tu/test/host.test.mjs).
// Kiểm: chỉ chủ phòng mời được, không mời chính mình / ghế lạ, người bị mời nhận {t:"kicked", by:"host"} (kết nối vẫn mở),
// không vào lại được trong thời gian chặn (cả "join" cùng phiên lẫn "resume" bằng token cũ), phiên khác (máy khác cùng
// mạng) vẫn vào được — chặn theo phiên, không theo IP; hết hạn chặn thì vào lại được; giữa ván không mời ra được.
// `node --test --test-concurrency=1 games-server/kick.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GAMES = [
  ["co-caro", "createCoCaroHost"], ["co-vua", "createCoVuaHost"], ["co-tuong", "createCoTuongHost"], ["o-an-quan", "createOAnQuanHost"],
  ["co-ca-ngua", "createCoCaNguaHost"], ["co-ty-phu", "createCoTyPhuHost"], ["dat-bom", "createDatBomHost"],
  ["ma-soi", "createMaSoiHost"], ["ai-la-noi-gian", "createNoiGianHost"],
];
const SID_A = "a".repeat(32), SID_B = "b".repeat(32), SID_C = "c".repeat(32);
const BAN_MS = 600;

function client(url) {
  const ws = new WebSocket(url), msgs = [], waiters = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); msgs.push(m); for (const w of [...waiters]) if (w.f(m)) { waiters.splice(waiters.indexOf(w), 1); w.r(m); } };
  return {
    ws, msgs, open: new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }),
    send: (o) => ws.send(JSON.stringify(o)),
    next(f, ms = 3000) {
      const hit = msgs.find(f); if (hit) { msgs.splice(msgs.indexOf(hit), 1); return Promise.resolve(hit); }
      return new Promise((r, j) => {
        const w = { f, r: (m) => { msgs.splice(msgs.indexOf(m), 1); r(m); } }; waiters.push(w);
        setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) { waiters.splice(i, 1); j(new Error("hết giờ chờ — tin cuối: " + JSON.stringify(msgs.at(-1)))); } }, ms);
      });
    },
  };
}

async function setup(game, fn) {
  const server = http.createServer((q, s) => s.end("x"));
  const host = require(`./${game}/host.js`)[fn](server, { lobbyGraceMs: 5000, kickBanMs: BAN_MS });
  await host.ready;
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `ws://127.0.0.1:${server.address().port}/ws/${game}`;
  const open = [];
  const mk = async () => { const c = client(url); open.push(c); await c.open; return c; };
  const stop = async () => { for (const c of open) c.ws.close(); host.close(); server.closeAllConnections?.(); await new Promise((r) => server.close(r)); };
  return { host, mk, stop };
}

async function pair(S) {
  const a = await S.mk(), b = await S.mk();
  a.send({ t: "create", name: "Chu", public: false, sid: SID_A });
  const { code } = await a.next((m) => m.t === "joined");
  b.send({ t: "join", code, name: "Khach", sid: SID_B });
  const jb = await b.next((m) => m.t === "joined");
  return { a, b, code, tokenB: jb.token };
}
const names = (S, code) => S.host.rooms.get(code).room.players.map((p) => p.name);

for (const [game, fn] of GAMES) {
  test(`${game}: chủ phòng mời ra ⇒ khách nhận "kicked", không vào lại / resume được 10 phút (theo phiên), giữ kết nối`, async () => {
    const S = await setup(game, fn);
    try {
      const { a, b, code, tokenB } = await pair(S);
      assert.deepEqual(names(S, code), ["Chu", "Khach"]);
      b.send({ t: "kick", target: 0 });
      assert.equal((await b.next((m) => m.t === "err" && m.req === "kick")).code, "not-host", "khách không mời ai ra được");
      a.send({ t: "kick", target: 0 });
      assert.equal((await a.next((m) => m.t === "err" && m.req === "kick")).code, "target", "không mời chính mình");
      for (const bad of [5, -1, "1", null, 1.5]) {
        a.send({ t: "kick", target: bad });
        assert.equal((await a.next((m) => m.t === "err" && m.req === "kick")).code, "target", "ghế lạ " + JSON.stringify(bad));
      }
      a.send({ t: "kick", target: 1, name: "Ai Do" }); // ghế đã đổi người (tên không khớp) ⇒ không mời nhầm
      assert.equal((await a.next((m) => m.t === "err" && m.req === "kick")).code, "target", "tên không khớp");
      assert.deepEqual(names(S, code), ["Chu", "Khach"], "chưa ai bị mời ra");

      a.send({ t: "kick", target: 1, name: "Khach" });
      assert.equal((await b.next((m) => m.t === "kicked")).by, "host");
      await sleep(50);
      assert.deepEqual(names(S, code), ["Chu"], "khách đã ra khỏi phòng");
      assert.equal(b.ws.readyState, 1, "kết nối của người bị mời ra vẫn mở");
      b.send({ t: "chat", text: "alo" });
      assert.equal((await b.next((m) => m.t === "err")).code, "no-room", "không còn gửi lệnh vào phòng được");

      // cùng phiên: join lại / resume bằng token cũ ⇒ "banned"
      b.send({ t: "join", code, name: "Khach", sid: SID_B });
      assert.equal((await b.next((m) => m.t === "err")).code, "banned");
      const b2 = await S.mk();
      b2.send({ t: "resume", code, token: tokenB, sid: SID_B });
      assert.equal((await b2.next((m) => m.t === "err")).code, "banned", "token cũ không resume được");
      const b3 = await S.mk();
      b3.send({ t: "resume", code, token: tokenB }); // client cũ không gửi sid: token vẫn bị chặn
      assert.equal((await b3.next((m) => m.t === "err")).code, "banned");

      // phiên khác (máy khác cùng mạng / cùng IP) vẫn vào được — không chặn theo IP
      const c = await S.mk();
      c.send({ t: "join", code, name: "Em", sid: SID_C });
      await c.next((m) => m.t === "joined");
      assert.deepEqual(names(S, code), ["Chu", "Em"]);
      c.send({ t: "leave" }); await c.next((m) => m.t === "left");

      // hết hạn chặn ⇒ vào lại được (vào như người mới, token mới)
      await sleep(BAN_MS + 100);
      b.send({ t: "join", code, name: "Khach", sid: SID_B });
      const again = await b.next((m) => m.t === "joined");
      assert.notEqual(again.token, tokenB);
      assert.deepEqual(names(S, code), ["Chu", "Khach"]);
    } finally { await S.stop(); }
  });
}

test("co-caro: giữa ván không mời ra được (phase); hết ván mời ra được, người còn lại về phòng chờ", async () => {
  const S = await setup("co-caro", "createCoCaroHost");
  try {
    const { a, b, code } = await pair(S);
    a.send({ t: "start" });
    await a.next((m) => m.t === "state" && m.v.phase === "play");
    a.send({ t: "kick", target: 1 });
    assert.equal((await a.next((m) => m.t === "err" && m.req === "kick")).code, "phase");
    const room = S.host.rooms.get(code).room;
    room.phase = "over"; // ván xong (đặt thẳng cho nhanh — luật thắng thua có test riêng)
    a.send({ t: "kick", target: 1 });
    await b.next((m) => m.t === "kicked");
    await a.next((m) => m.t === "state" && m.v.phase === "lobby" && m.v.players.length === 1);
  } finally { await S.stop(); }
});

test("ma-soi: hết ván (end) mời ra ⇒ ghế mất token, không resume được; Chơi ván mới bỏ ghế đó", async () => {
  const S = await setup("ma-soi", "createMaSoiHost");
  try {
    const { a, b, code, tokenB } = await pair(S);
    const room = S.host.rooms.get(code).room;
    room.phase = "end";
    a.send({ t: "kick", target: 1 });
    await b.next((m) => m.t === "kicked");
    await sleep(50);
    assert.equal(room.players[1].token, null);
    assert.equal(room.players[1].connected, false);
    const b2 = await S.mk();
    b2.send({ t: "resume", code, token: tokenB, sid: SID_B });
    assert.equal((await b2.next((m) => m.t === "err")).code, "banned");
    assert.equal(room._again(room.host).ok, true);
    assert.deepEqual(names(S, code), ["Chu"]);
  } finally { await S.stop(); }
});

test("ma-soi: chủ phòng rời ⇒ người kế nhiệm (host migration) mời ra được, chủ cũ thì không", async () => {
  const S = await setup("ma-soi", "createMaSoiHost");
  try {
    const { a, b, code } = await pair(S);
    const c = await S.mk();
    c.send({ t: "join", code, name: "Em", sid: SID_C }); await c.next((m) => m.t === "joined");
    a.send({ t: "leave" }); await a.next((m) => m.t === "left");
    await sleep(50);
    const room = S.host.rooms.get(code).room;
    assert.equal(room.players[room.host].name, "Khach", "Khach thành chủ phòng");
    b.send({ t: "kick", target: room.players.findIndex((p) => p.name === "Em") });
    assert.equal((await c.next((m) => m.t === "kicked")).by, "host");
    c.send({ t: "kick", target: 0 });
    assert.equal((await c.next((m) => m.t === "err")).code, "no-room");
  } finally { await S.stop(); }
});
