// "Ván tiếp" hai phía (BRD-09, games-server/rematch.js) cho Cờ Caro, Cờ Vua, Cờ Tướng, Ô Ăn Quan.
// Kiểm trên Room với đồng hồ giả (đếm ngược chính xác) + qua WebSocket thật (client cũ chỉ gửi "again" một lần vẫn chạy).
// `node --test --test-concurrency=1 games-server/rematch.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { Rematch, AGAIN_MS } = require("./rematch.js");

/** Đồng hồ giả: setTimeout chỉ chạy khi gọi tick(ms). */
function fakeClock() {
  let now = 1000, id = 0; const timers = new Map();
  return {
    now: () => now,
    setTimeout: (f, ms) => { const k = ++id; timers.set(k, { at: now + ms, f }); return k; },
    clearTimeout: (k) => { timers.delete(k); },
    tick(ms) {
      const end = now + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((x, y) => x[1].at - y[1].at)[0];
        if (!due) break;
        timers.delete(due[0]); now = due[1].at; due[1].f();
      }
      now = end;
    },
    get pending() { return timers.size; },
  };
}

const LOAD = async (g) => [await import(`../prototype/games/${g}/logic.js`), await import(`../prototype/games/${g}/ai.js`)];
// Mỗi game: cách dựng phòng 2 người đã chơi xong một ván (pha "over") + đọc "số ván" để biết ván mới đã mở chưa.
const GAMES = {
  "co-caro": {
    Room: () => require("./co-caro/room.js").Room,
    finish(r) { const k = [0, 0]; while (r.phase === "play") { const i = r.s.turn - 1; r.handle(i, { t: "move", r: i ? 9 : 7, c: k[i]++ }); } }, // ai tới lượt thì xếp hàng của mình
    round: (r) => r.s.round,
  },
  "co-vua": { Room: () => require("./co-vua/room.js").Room, finish(r) { r.handle(1, { t: "resign" }); }, round: (r) => r.s.round },
  "co-tuong": { Room: () => require("./co-tuong/room.js").Room, finish(r) { r.handle(1, { t: "resign" }); }, round: (r) => r.round },
  "o-an-quan": {
    Room: () => require("./o-an-quan/room.js").Room,
    finish(r) { r.s = { ...r.s, winner: 0, final: [40, 20], tally: [1, 0, 0] }; r.phase = "over"; r.schedule(); }, // dựng sẵn kết quả (luật đã có test riêng)
    round: (r) => r.s.round,
  },
};

async function mkRoom(game, clock, timings) {
  const [L, A] = await LOAD(game), G = GAMES[game], Room = G.Room();
  let pushes = 0;
  const r = new Room({ code: "ABCDE", L, A, clock, timings, onChange: () => pushes++ });
  r.join("An", "a".repeat(32)); r.join("Bình", "b".repeat(32));
  r.handle(0, { t: "start" });
  G.finish(r);
  assert.equal(r.phase, "over", game + ": dựng ván xong");
  return { r, G, pushes: () => pushes };
}

for (const game of Object.keys(GAMES)) {
  test(`${game}: một người bấm "Ván tiếp" ⇒ chưa mở ván, cả hai thấy cờ sẵn sàng + hạn 10 s; người kia bấm ⇒ mở ngay`, async () => {
    const clock = fakeClock();
    const { r, G } = await mkRoom(game, clock);
    const round0 = G.round(r);
    assert.deepEqual(r.handle(1, { t: "again" }), { ok: true });
    assert.equal(r.phase, "over", "ván chưa mở — thẻ kết quả của người kia còn nguyên");
    for (const i of [0, 1]) {
      const v = r.viewFor(i);
      assert.deepEqual(v.again, [false, true]);
      assert.equal(v.againDeadline, clock.now() + AGAIN_MS);
    }
    assert.deepEqual(r.handle(1, { t: "again" }), { ok: true }, "bấm lại không lỗi, không dời hạn");
    assert.equal(r.viewFor(0).againDeadline, clock.now() + AGAIN_MS);
    clock.tick(3000);
    assert.deepEqual(r.handle(0, { t: "again" }), { ok: true });
    assert.equal(r.phase, "play"); assert.equal(G.round(r), round0 + 1);
    assert.deepEqual(r.viewFor(0).again, [false, false]); assert.equal(r.viewFor(0).againDeadline, 0);
    clock.tick(AGAIN_MS * 2); // hẹn giờ đếm ngược đã huỷ: không mở thêm ván
    assert.equal(G.round(r), round0 + 1);
    r.close();
  });

  test(`${game}: chỉ một người bấm (client cũ) ⇒ hết 10 s tự mở ván mới`, async () => {
    const clock = fakeClock();
    const { r, G } = await mkRoom(game, clock);
    const round0 = G.round(r);
    r.handle(0, { t: "again" });
    clock.tick(AGAIN_MS - 1);
    assert.equal(r.phase, "over");
    clock.tick(1);
    assert.equal(r.phase, "play"); assert.equal(G.round(r), round0 + 1);
    assert.deepEqual(r.viewFor(1).again, [false, false]);
    r.close();
  });

  test(`${game}: người kia rời phòng / bị mời ra trong lúc đếm ngược ⇒ về phòng chờ, không mở ván`, async () => {
    const clock = fakeClock();
    const { r } = await mkRoom(game, clock);
    r.handle(0, { t: "again" });
    r.leave(1);
    assert.equal(r.phase, "lobby");
    assert.equal(r.viewFor(0).againDeadline, 0); assert.deepEqual(r.viewFor(0).again, [false]);
    clock.tick(AGAIN_MS * 2);
    assert.equal(r.phase, "lobby", "hết hạn cũ không mở ván với 1 người");
    // người mới vào, chủ phòng bắt đầu lại: cờ sẵn sàng cũ không còn
    r.join("Cường", "c".repeat(32)); r.handle(0, { t: "start" });
    GAMES[game].finish(r);
    assert.deepEqual(r.viewFor(0).again, [false, false]);
    r.close();
  });

  test(`${game}: "again" giữa ván vẫn bị từ chối; đóng phòng huỷ đếm ngược`, async () => {
    const clock = fakeClock();
    const { r } = await mkRoom(game, clock, { again: 500 });
    r.handle(0, { t: "again" });
    assert.equal(r.viewFor(1).againDeadline, clock.now() + 500, "timings.again đổi được (test)");
    r.close();
    clock.tick(1000);
    assert.equal(r.phase, "over");
    assert.equal(clock.pending, 0);
    const clock2 = fakeClock(), { r: r2 } = await mkRoom(game, clock2);
    r2.handle(0, { t: "again" }); r2.handle(1, { t: "again" });
    assert.equal(r2.phase, "play");
    assert.deepEqual(r2.handle(1, { t: "again" }), { err: "phase" });
    r2.close();
  });
}

test("Rematch: bỏ qua ghế không token, hạn không âm", () => {
  const clock = fakeClock(); let went = 0;
  const m = new Rematch(clock, -5);
  assert.equal(m.ms, AGAIN_MS);
  const ps = [{ token: "x" }, { token: null }];
  assert.equal(m.vote("x", ps, () => went++), "wait", "ghế đã mất token (bị mời ra) không bao giờ 'sẵn sàng' ⇒ chờ đếm ngược");
  assert.deepEqual(m.flags(ps), [true, false]);
  clock.tick(AGAIN_MS); assert.equal(went, 1);
});

// ---- WebSocket thật: 2 người, client cũ (chỉ B bấm) vs client mới (cả hai bấm) ----
const HOSTS = [["co-caro", "createCoCaroHost"], ["co-vua", "createCoVuaHost"], ["co-tuong", "createCoTuongHost"], ["o-an-quan", "createOAnQuanHost"]];
function client(url) {
  const ws = new WebSocket(url), states = [], waiters = []; let v = null;
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.t === "state") { v = m.v; states.push(m.v); } for (const w of [...waiters]) if (w.f(m)) { waiters.splice(waiters.indexOf(w), 1); w.r(m); } };
  return {
    ws, get v() { return v; }, open: new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }),
    send: (o) => ws.send(JSON.stringify(o)),
    next(f, ms = 4000) {
      if (v && f({ t: "state", v })) return Promise.resolve({ t: "state", v });
      return new Promise((r, j) => { const w = { f, r }; waiters.push(w); setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) { waiters.splice(i, 1); j(new Error("hết giờ chờ — v=" + JSON.stringify(v)?.slice(0, 200))); } }, ms); });
    },
  };
}
const st = (f) => (m) => m.t === "state" && f(m.v);

for (const [game, fn] of HOSTS) {
  test(`${game} (WebSocket): B bấm Ván tiếp ⇒ A thấy "đối thủ muốn chơi tiếp" + hạn; hết hạn ⇒ cả hai vào ván mới`, async () => {
    const server = http.createServer((q, s) => s.end("x"));
    const host = require(`./${game}/host.js`)[fn](server, { timings: { turn: 60000, away: 60000, again: 400 } });
    await host.ready;
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const url = `ws://127.0.0.1:${server.address().port}/ws/${game}`;
    const a = client(url), b = client(url);
    try {
      await a.open; await b.open;
      a.send({ t: "create", name: "An", public: false });
      const { code } = await a.next((m) => m.t === "joined");
      b.send({ t: "join", code, name: "Bình" }); await b.next((m) => m.t === "joined");
      await a.next(st((v) => v.players.length === 2));
      a.send({ t: "start" }); await b.next(st((v) => v.phase === "play"));
      const room = host.rooms.get(code).room;
      GAMES[game].finish(room); room.changed();
      await a.next(st((v) => v.phase === "over")); await b.next(st((v) => v.phase === "over"));
      const gid = a.v.gid;
      b.send({ t: "again" });
      await a.next(st((v) => v.phase === "over" && v.again && v.again[1] === true));
      assert.ok(a.v.againDeadline > 0); assert.equal(a.v.gid, gid);
      await a.next(st((v) => v.phase === "play" && v.gid !== gid), 3000);
      await b.next(st((v) => v.phase === "play" && v.gid !== gid), 3000);
      // ván 2 xong ⇒ cả hai bấm ⇒ mở ngay (không chờ hạn)
      GAMES[game].finish(room); room.changed();
      await a.next(st((v) => v.phase === "over"));
      const gid2 = a.v.gid, t0 = Date.now();
      a.send({ t: "again" }); b.send({ t: "again" });
      await a.next(st((v) => v.phase === "play" && v.gid !== gid2));
      assert.ok(Date.now() - t0 < 350, "cả hai sẵn sàng ⇒ mở ngay");
    } finally {
      a.ws.close(); b.ws.close(); host.close(); server.closeAllConnections?.(); await new Promise((r) => server.close(r));
      await sleep(20);
    }
  });
}
