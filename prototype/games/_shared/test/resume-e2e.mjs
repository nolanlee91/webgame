// E2E trình duyệt thật: ĐÓNG HẲN TAB giữa ván online rồi mở lại link mời ⇒ về đúng ghế, bàn cờ nguyên vẹn; mở tab thứ hai
// của cùng người ⇒ tab mới giữ ghế, tab cũ báo "đã mở ở tab khác". Hai người = hai hồ sơ trình duyệt riêng (localStorage tách biệt).
//   node prototype/games/_shared/test/resume-e2e.mjs [co-caro o-an-quan co-ca-ngua ...]
//   BASE=http://127.0.0.1:8921 node …   — dùng server đang chạy thay vì tự dựng server.js trong tiến trình
//   SHOTS=<thư mục>                     — lưu ảnh chụp B sau khi vào lại
import { launchChrome, startServer, sleep } from "./cdp.mjs";
import { join } from "node:path";

// Mỗi game: cách tạo / vào phòng qua giao diện, gửi lệnh (giống nút bấm gửi), nước đi thử theo trạng thái.
const caroLike = (move) => ({
  async create(t) { await t.ev(`document.getElementById("nameIn").value = "An"`); await t.click("#createBtn");
    if (await t.ev(`!!document.getElementById("createRoomBtn")`)) await t.click("#createRoomBtn"); }, // Caro / Ô Ăn Quan: bước chọn bàn / luật
  async join(t) { await t.ev(`document.getElementById("nameIn").value = "Binh"`); await t.click("#joinBtn"); },
  async start(t) { await t.click("#rStart"); },
  send: (o) => `window.__game.net.send(${JSON.stringify(o)})`,
  move,
});
const GAMES = {
  "co-caro": caroLike((v, k) => ({ t: "move", r: 7, c: 5 + k })),
  "o-an-quan": { ...caroLike(null), moveJs: `(() => { const m = window.__game.legal()[0]; return !!m && window.__game.net.send({ t: "move", pit: m[0], dir: m[1] }); })()` },
  "co-ca-ngua": {
    async create(t) { await t.ev(`document.getElementById("cnName").value = "An"`); await t.click('[data-e="create"]'); },
    async join(t) { await t.ev(`document.getElementById("cnName").value = "Binh"`); await t.click('[data-e="join"]'); },
    async start(t) { await t.ev(`window.__net.send({ t: "start" })`); },
    send: (o) => `window.__net.send(${JSON.stringify(o)})`,
    move: () => ({ t: "roll" }),
  },
  "co-vua": caroLike(null), "co-tuong": caroLike(null),
  "co-ty-phu": {
    R: "window.__cotyphu.room",
    async create(t) { await t.ev(`document.getElementById("nmIn").value = "An"`); await t.click("#mkRoom"); },
    async join(t) { await t.ev(`document.getElementById("nmIn").value = "Binh"`); await t.click("#joinRoom"); },
    async start(t) { await t.click("#start"); },
    send: (o) => `window.__cotyphu.net.send(${JSON.stringify(o)})`,
  },
};
for (const G of Object.values(GAMES)) G.R ||= "window.__game.room"; // biểu thức đọc trạng thái phòng máy chủ gửi về
let R = ""; // của game đang chạy

const room = (t) => t.ev(`(() => { let r = null; try { r = ${R}; } catch {} return r ? JSON.parse(JSON.stringify({ phase: r.phase, you: r.you, seq: r.seq, gid: r.gid, code: r.code, game: r.game, players: r.players.map((p) => ({ connected: p.connected })) })) : null; })()`);
const gameOf = (r) => JSON.stringify(r && r.game, (k, v) => (k === "bot" ? undefined : v)); // Tỷ Phú gắn players[].bot theo người xem

async function step(G, a, b, k) { // một nước: gửi từ cả hai người, người không tới lượt bị máy chủ từ chối
  const before = (await room(a)).seq;
  for (const t of [a, b]) await t.ev(G.moveJs || G.send(G.move(await room(t), k)));
  await a.waitFor(`${R}.seq > ${before}`);
  await sleep(300);
}

async function run(game, chrome, base) {
  const G = GAMES[game]; R = G.R; const url = `${base}/games/${game}/`;
  const ctxA = await chrome.newContext(), ctxB = await chrome.newContext();
  const A = await chrome.newTab("A", 1366, 900, false, ctxA);
  await A.go(url); await G.create(A);
  await A.waitFor(`${R} && ${R}.code`);
  const code = (await room(A)).code;
  const B = await chrome.newTab("B", 1366, 900, false, ctxB);
  await B.go(`${url}?room=${code}`); await G.join(B);
  await A.waitFor(`${R} && ${R}.players.length === 2`);
  await G.start(A);
  await A.waitFor(`${R}.phase === "play"`); await B.waitFor(`${R} && ${R}.phase === "play"`);
  if (G.move || G.moveJs) { await step(G, A, B, 0); if (game !== "co-ca-ngua") await step(G, A, B, 1); }
  const bBefore = await room(B);
  const out = { game, code, seqBefore: bBefore.seq, you: bBefore.you };

  // (1) đóng hẳn tab B ⇒ A thấy B mất kết nối; mở lại link mời trong tab mới cùng hồ sơ ⇒ B về đúng ghế, bàn nguyên vẹn
  await B.closeTab();
  await A.waitFor(`${R}.players[${bBefore.you}].connected === false`);
  await sleep(500);
  const B2 = await chrome.newTab("B2", 1366, 900, false, ctxB);
  await B2.go(`${url}?room=${code}`);
  await B2.waitFor(`${R} && ${R}.phase === "play"`);
  await A.waitFor(`${R}.players[${bBefore.you}].connected === true`);
  const [ra, rb] = [await room(A), await room(B2)];
  if (rb.you !== bBefore.you) throw new Error(`${game}: sai ghế ${rb.you} ≠ ${bBefore.you}`);
  if (rb.gid !== bBefore.gid || gameOf(ra) !== gameOf(rb)) throw new Error(`${game}: bàn cờ lệch sau khi vào lại`);
  if (rb.seq < bBefore.seq) throw new Error(`${game}: mất nước đi`);
  out.resume = { you: rb.you, seq: rb.seq, sameBoardAsA: true };
  if ((G.move || G.moveJs) && game !== "co-ca-ngua") { await step(G, A, B2, 2); out.moveAfterResume = (await room(B2)).seq; } // vẫn chơi tiếp được
  if (process.env.SHOTS) await B2.shot(join(process.env.SHOTS, `resume-${game}.png`));

  // (2) tab thứ hai cùng người ⇒ tab mới giữ ghế, tab cũ báo đã mở ở tab khác (không ai bị đá cả hai)
  const B3 = await chrome.newTab("B3", 1366, 900, false, ctxB);
  await B3.go(`${url}?room=${code}`);
  await B3.waitFor(`${R} && ${R}.phase === "play" && ${R}.you === ${bBefore.you}`);
  await B2.waitFor(`document.body.innerText.includes("tab khác")`);
  await sleep(400);
  const r3 = await room(B3), ra3 = await room(A);
  if (!ra3.players[bBefore.you].connected) throw new Error(`${game}: ghế B mất kết nối sau khi đổi tab`);
  if (gameOf(r3) !== gameOf(ra3)) throw new Error(`${game}: tab mới lệch bàn`);
  out.secondTab = { you: r3.you, oldTabNotice: true };
  const errs = [...A.errors, ...B2.errors, ...B3.errors];
  if (errs.length) throw new Error(`${game}: lỗi JS: ${errs.slice(0, 3).join(" | ")}`);
  for (const t of [A, B2, B3]) await t.closeTab();
  return out;
}

const games = process.argv.slice(2).length ? process.argv.slice(2) : ["co-caro", "o-an-quan", "co-ca-ngua"];
let srv = null, base = process.env.BASE;
if (!base) { srv = await startServer(); base = srv.base; }
const chrome = await launchChrome();
let fail = 0;
try {
  for (const g of games) {
    try { console.log("ĐẠT", JSON.stringify(await run(g, chrome, base))); }
    catch (e) { fail++; console.log("TRƯỢT", g, e.message); }
  }
} finally { chrome.close(); if (srv) srv.server.close(); }
console.log(fail ? `${fail} game trượt` : "Tất cả đạt");
process.exit(fail ? 1 : 0);
