// Đợt 8 (quyết định chủ dự án 26/11): phòng online MẶC ĐỊNH CÔNG KHAI; tích "Phòng kín" (client gửi public:false) ⇒ phòng
// không hiện ở /api/lobby (sảnh trang chủ) và chỉ vào được bằng mã / link. Giao thức giữ tương thích: client cũ không gửi
// trường public ⇒ công khai như trước. Chạy với server.js thật, WebSocket thật, cho cả 10 game online.
// `node --test games-server/room-privacy.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isJoined = (m) => m.t === "joined" || m.t === "room"; // Nối Từ trả "room"
const GAMES = ["ma-soi", "ai-la-noi-gian", "dat-bom", "noi-tu", "co-caro", "co-vua", "co-tuong", "o-an-quan", "co-ca-ngua", "co-ty-phu"];

function client(port, game) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/${game}`);
  const msgs = [];
  ws.onmessage = (e) => { try { msgs.push(JSON.parse(e.data)); } catch {} };
  const opened = new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = bad; });
  return { ws, msgs, opened };
}

/** tạo phòng; máy chủ còn nạp logic / từ điển ("loading") thì thử lại */
async function create(port, game, extra) {
  for (let k = 0; k < 60; k++) {
    const c = client(port, game); await c.opened;
    c.ws.send(JSON.stringify({ t: "create", name: "Bé Na", ...extra }));
    for (let i = 0; i < 40 && !c.msgs.some((m) => isJoined(m) || m.t === "err"); i++) await sleep(25);
    const j = c.msgs.find(isJoined);
    if (j) return { c, code: j.code };
    const err = c.msgs.find((m) => m.t === "err")?.code;
    c.ws.close();
    if (err !== "loading") throw new Error(`${game}: tạo phòng lỗi ${err}`);
    await sleep(250);
  }
  throw new Error(`${game}: máy chủ nạp quá lâu`);
}

test("10 game online: mặc định / public:true ⇒ hiện ở /api/lobby; public:false (Phòng kín) ⇒ không hiện, vẫn vào được bằng mã; Đặt Bom đổi trong phòng chờ", { timeout: 60000 }, async () => {
  const server = require("../server.js");
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  const { port } = server.address();
  const open = [];
  try {
    const made = {};
    for (const g of GAMES) {
      made[g] = {
        old: await create(port, g, {}),                // client cũ: không gửi public
        pub: await create(port, g, { public: true }),  // ô "Phòng kín" để trống
        priv: await create(port, g, { public: false }), // tích "Phòng kín"
      };
      open.push(...Object.values(made[g]).map((x) => x.c));
    }
    await sleep(100);
    const lobby = await (await fetch(`http://127.0.0.1:${port}/api/lobby`)).json();
    const listed = new Set(lobby.rooms.map((r) => `${r.game}:${r.code}`));
    for (const g of GAMES) {
      assert.ok(listed.has(`${g}:${made[g].old.code}`), `${g}: không gửi public ⇒ công khai (tương thích client cũ)`);
      assert.ok(listed.has(`${g}:${made[g].pub.code}`), `${g}: public:true ⇒ hiện ở sảnh`);
      assert.ok(!listed.has(`${g}:${made[g].priv.code}`), `${g}: Phòng kín ⇒ KHÔNG hiện ở /api/lobby`);
      // phòng kín vẫn vào được bằng mã. Nối Từ: vào = bắt đầu ván ngay (trọng tài đặt hẹn giờ 30 s giữ tiến trình test),
      // đường "enter" của Nối Từ không xét public (chỉ xét mã) nên bỏ qua ở đây — host.test.mjs đã kiểm vào bằng mã.
      if (g === "noi-tu") continue;
      const j = client(port, g); await j.opened; open.push(j);
      j.ws.send(JSON.stringify({ t: g === "noi-tu" ? "enter" : "join", code: made[g].priv.code, name: "Bé Bi" }));
      for (let i = 0; i < 40 && !j.msgs.some((m) => isJoined(m) || m.t === "err"); i++) await sleep(25);
      assert.ok(j.msgs.some(isJoined), `${g}: vào phòng kín bằng mã: ${JSON.stringify(j.msgs.find((m) => m.t === "err"))}`);
    }
    // phòng kín: /api/lobby không lộ mã ở bất kỳ trường nào
    const raw = JSON.stringify(lobby);
    for (const g of GAMES) assert.ok(!raw.includes(made[g].priv.code), `${g}: mã phòng kín không xuất hiện trong /api/lobby`);
    // Đặt Bom: chủ phòng đổi "Phòng kín" ngay trong phòng chờ (lệnh public cũ, giữ nguyên) ⇒ sảnh đổi theo
    const { c, code } = made["dat-bom"].old;
    const inLobby = async () => (await (await fetch(`http://127.0.0.1:${port}/api/lobby`)).json()).rooms.some((r) => r.code === code);
    c.ws.send(JSON.stringify({ t: "public", on: false })); await sleep(150);
    assert.equal(await inLobby(), false, "Đặt Bom: tích Phòng kín trong phòng chờ ⇒ biến khỏi sảnh");
    c.ws.send(JSON.stringify({ t: "public", on: true })); await sleep(150);
    assert.equal(await inLobby(), true, "Đặt Bom: bỏ tích ⇒ hiện lại");
  } finally {
    // rời phòng đàng hoàng ⇒ máy chủ xoá phòng, không còn hẹn giờ giữ tiến trình test sống
    for (const c of open) try { c.ws.send('{"t":"leave"}'); } catch {}
    await sleep(200);
    for (const c of open) try { c.ws.close(); } catch {}
    await sleep(100);
    await new Promise((ok) => server.close(ok));
    server.closeAllConnections?.();
  }
});
