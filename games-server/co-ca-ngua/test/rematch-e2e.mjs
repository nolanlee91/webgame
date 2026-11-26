// E2E trình duyệt thật cho Cờ Cá Ngựa online, Đợt 7 (BOARD2-02 / BOARD2-03 / BRD-15). 3 hồ sơ Chrome = 3 người.
//   • "Ván mới": B bấm ⇒ thẻ kết quả của A và C vẫn mở, thấy "1/3 muốn chơi tiếp · ván mới sau N giây", nút của B thành
//     "Đã sẵn sàng ✓"; A, C bấm ⇒ cả phòng vào ván mới.
//   • "Về phòng chờ" ở thẻ kết quả ⇒ cả nhóm về phòng chờ, cùng mã, đủ 3 người (không ai bị đẩy ra màn nhập mã).
// Ván được "kết thúc" bằng cách chỉnh thẳng phòng trên máy chủ (cùng tiến trình) để test nhanh, không phải chơi hết ván.
// Chạy: node games-server/co-ca-ngua/test/rematch-e2e.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { REPO, launchChrome, startServer, sleep } from "../../../prototype/games/_shared/test/cdp.mjs";

const require = createRequire(import.meta.url);
const { Room } = require(join(REPO, "games-server/co-ca-ngua/room.js"));
const live = [];
const newGame0 = Room.prototype.newGame;
Room.prototype.newGame = function (...a) { if (!live.includes(this)) live.push(this); return newGame0.apply(this, a); };
/** Kết thúc ván ngay trên máy chủ: ghế đầu thắng; seq tăng, không có act ⇒ client nhận nguyên trạng thái. */
function forceOver(room) {
  const g = room.g, w = g.seats[0];
  const S = g.rules.stableLen, n = g.horses[w].length; // ô chuồng cao nhất: trackLen - 1 + bậc (logic.js stableLevel)
  g.horses[w] = g.horses[w].map((_, k) => g.rules.trackLen - 1 + S - k);
  if (n > S) throw new Error("stableLen < số ngựa");
  g.phase = "over"; g.winner = w; g.moves = [];
  room.clock.clearTimeout(room.timer); room.timer = null; room.deadline = 0;
  room.phase = "over"; room.seq++; room.lastAct = null; room.changed();
}

let fails = 0;
const ok = (c, msg) => { console.log(`${c ? "✔" : "✘"} ${msg}`); if (!c) fails++; };
const { server, base } = await startServer();
const chrome = await launchChrome();
const url = `${base}/games/co-ca-ngua/`;
try {
  const tabs = [];
  for (const [n, nm] of [["A", "An"], ["B", "Bình"], ["C", "Chi"]]) tabs.push(await chrome.newTab(n, 1280, 860, false, await chrome.newContext()));
  const [A, B, C] = tabs;
  await A.go(url); await A.waitFor(`!!document.getElementById("cnName")`);
  await A.ev(`document.getElementById("cnName").value = "An"`); await A.click('[data-e="create"]');
  await A.waitFor(`!!(window.__game && window.__game.room && window.__game.room.code)`);
  const code = await A.ev(`window.__game.room.code`);
  for (const [T, nm] of [[B, "Bình"], [C, "Chi"]]) {
    await T.go(url + "?room=" + code); await T.waitFor(`!!document.getElementById("cnName")`);
    await T.ev(`document.getElementById("cnName").value = ${JSON.stringify(nm)}`); await T.click('[data-e="join"]');
  }
  await A.waitFor(`window.__game.room.players.length === 3`);
  await A.click('#playBtn');
  for (const T of tabs) await T.waitFor(`window.__game.room && window.__game.room.phase === "play"`);
  const room = live.find((r) => r.code === code);
  ok(!!room, `máy chủ có phòng ${code}`);

  // ---- hết ván → B bấm "Ván mới" ----
  forceOver(room);
  const resultOpen = `!document.querySelector(".cn-result").hidden`;
  for (const T of tabs) await T.waitFor(resultOpen, 8000);
  await B.click('.cn-result [data-act="again"]');
  await A.waitFor(`!document.querySelector(".cn-result .again-note").hidden`, 5000);
  const noteA = await A.ev(`document.querySelector(".cn-result .again-note").textContent`);
  ok(/^1\/3 muốn chơi tiếp · ván mới sau \d+ giây$/.test(noteA), `A thấy "${noteA}"`);
  await sleep(1500);
  ok(await A.ev(resultOpen) && await C.ev(resultOpen), "B bấm Ván mới ⇒ thẻ kết quả của A và C vẫn mở");
  ok((await B.ev(`document.querySelector('.cn-result [data-act="again"]').textContent`)) === "Đã sẵn sàng ✓", 'nút của B: "Đã sẵn sàng ✓"');
  ok(await B.ev(`document.querySelector('.cn-result [data-act="again"]').disabled`), "nút của B bị khoá");
  ok((await A.ev(`document.querySelector('.cn-result [data-act="again"]').textContent`)) === "Chơi tiếp ngay ▶", 'nút của A: "Chơi tiếp ngay ▶"');
  ok((await A.ev(`document.querySelector('.cn-result [data-act="room"]').textContent`)) === "Về phòng chờ", 'nút "Về phòng chờ"');
  await A.click('.cn-result [data-act="again"]');
  await sleep(500);
  ok(await C.ev(resultOpen), "2/3 sẵn sàng ⇒ C vẫn thấy thẻ kết quả");
  await C.click('.cn-result [data-act="again"]');
  for (const T of tabs) await T.waitFor(`window.__game.room.phase === "play" && window.__game.room.gid === 2 && document.querySelector(".cn-result").hidden`, 5000);
  ok(true, "cả 3 sẵn sàng ⇒ cả phòng vào ván mới ngay");

  // ---- hết ván → C bấm "Về phòng chờ" ----
  forceOver(room);
  for (const T of tabs) await T.waitFor(resultOpen, 8000);
  await C.click('.cn-result [data-act="room"]');
  for (const T of tabs) await T.waitFor(`window.__game.room && window.__game.room.phase === "lobby" && document.querySelector(".cn-table").classList.contains("is-lobby")`, 5000);
  const st = await Promise.all(tabs.map((T) => T.ev(`window.__game.room.code + "|" + window.__game.room.players.map(p => p.name).join(",")`)));
  ok(st.every((x) => x === `${code}|An,Bình,Chi`), `cả nhóm về phòng chờ, cùng mã, đủ người (${st.join(" / ")})`);
  await A.click('#playBtn');
  for (const T of tabs) await T.waitFor(`window.__game.room.phase === "play"`, 5000);
  ok(true, "từ phòng chờ bắt đầu ván mới được");
  const errs = tabs.flatMap((T) => T.errors.map((e) => `${T.name}: ${e}`));
  ok(!errs.length, `không có lỗi JS (${errs.join(" | ")})`);
} catch (e) {
  console.error(e); fails++;
} finally {
  chrome.close(); server.close(); server.closeAllConnections?.();
  console.log(fails ? `\n✘ ${fails} lỗi` : "\n✔ Cá Ngựa online: Ván mới / Về phòng chờ xong");
  setTimeout(() => process.exit(fails ? 1 : 0), 1000);
}
